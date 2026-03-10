import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'

// ================================
// 分组拖拽排序 + 边缘自动滚动（教程）
//
// 适用场景：
// - "分组 -> 条目" 结构的排序（组内/跨组）
//
// 最小接入步骤：
// 1) 准备数据结构（每组有 id + itemIds）
// 2) const drag = useDragSortAutoScroll(groups, { edgePx, maxStepPx })
// 3) 绑定拖拽事件：
//    - 分组：onGroupDragStart / onGroupDragOver / onGroupDrop / onGroupDragEnd
//    - 条目：onItemDragStart / onItemDragOver / onItemDrop / onItemDragEnd
// 4) 绑定状态类（用于落点提示）：
//    - 分组：isGroupDropAnchor / isGroupDropAtEnd
//    - 条目：isItemDropAnchor / isItemDropAtEnd
//
// 关键概念：
// - 预览列表：拖拽中先改"预览"，drop 时再提交
// - 落点边界：上半区=插到前面，下半区=插到后面
// - 末尾落点：拖到末尾区域可插入到最后
// - 自动滚动：靠近容器上下边缘自动滚动
// ================================

// 分组基础结构：分组 id + 该分组内条目 id 列表。
export interface DragSortGroup {
  id: string
  itemIds: string[]
}

// 拖拽条目的最小状态：条目 id + 来源分组。
interface DragItemState {
  itemId: string
  sourceGroupId: string
}

// 预览中的落点：落到哪个分组 + 插入索引。
interface DropTarget {
  groupId: string
  index: number
}

// 可选参数：边缘触发阈值与每帧最大滚动步长。
export interface UseDragSortAutoScrollOptions {
  edgePx?: number
  maxStepPx?: number
}

// 兼容 ref / shallowRef 的最小结构。
interface MutableRef<TValue> {
  value: TValue
}

export function useDragSortAutoScroll<T extends DragSortGroup>(
  groups: MutableRef<T[]>,
  options: UseDragSortAutoScrollOptions = {}
) {
  // 距离上下边缘多少像素开始自动滚动。
  const edgePx = options.edgePx ?? 56
  // 每帧最大滚动步长（像素）。
  const maxStepPx = options.maxStepPx ?? 20

  // 分组拖拽：当前拖拽的分组 id。
  const dragGroupId = ref<string | null>(null)
  // 分组落点：插入位置的"边界"索引。
  const groupDropBoundaryIndex = ref<number | null>(null)
  // 条目拖拽：当前拖拽的条目状态。
  const dragItem = ref<DragItemState | null>(null)
  // 条目落点：目标分组 + 插入索引。
  const itemDropTarget = ref<DropTarget | null>(null)
  // 预览分组：拖拽中实时重排用的临时列表。
  const previewGroups = shallowRef<T[] | null>(null)

  // 分组拖拽：用 rAF 合并多次 dragover，避免抖动。
  let groupRafHandle: number | null = null
  let pendingGroupBoundary: number | null = null
  // 条目拖拽：同理。
  let itemRafHandle: number | null = null
  let pendingItemTarget: DropTarget | null = null

  // 自动滚动状态：rAF 句柄 + 指针坐标 + 滚动容器。
  let autoScrollRafHandle: number | null = null
  let autoScrollPointerY: number | null = null
  let autoScrollContainer: HTMLElement | null = null

  // 真实渲染用的数据：有预览就用预览，没有就用原数据。
  const renderedGroups = computed(() => previewGroups.value ?? groups.value)

  // 深拷贝分组结构，避免直接改动源数据。
  function cloneGroups(input: T[]): T[] {
    return input.map((group) => ({
      ...group,
      itemIds: [...group.itemIds]
    }))
  }

  // 懒创建预览列表：开始拖拽时再复制一份。
  function ensurePreviewGroups(): T[] {
    if (!previewGroups.value) {
      previewGroups.value = cloneGroups(groups.value)
    }
    return previewGroups.value
  }

  // 简单的数组位移（只在合法范围内生效）。
  function moveItem<TItem>(items: TItem[], fromIndex: number, toIndex: number) {
    if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) {
      return
    }

    const [item] = items.splice(fromIndex, 1)
    items.splice(toIndex, 0, item)
  }

  function hasActiveDrag(): boolean {
    return Boolean(dragGroupId.value || dragItem.value)
  }

  // 没有拖拽时清掉预览，避免状态残留。
  function clearPreviewIfIdle() {
    if (!hasActiveDrag()) {
      previewGroups.value = null
    }
  }

  // 判断预览与真实数据是否相同，避免无意义提交。
  function isLayoutEqual(left: T[], right: T[]): boolean {
    if (left.length !== right.length) {
      return false
    }

    for (let index = 0; index < left.length; index += 1) {
      const a = left[index]
      const b = right[index]
      if (a.id !== b.id || a.itemIds.length !== b.itemIds.length) {
        return false
      }

      for (let itemIndex = 0; itemIndex < a.itemIds.length; itemIndex += 1) {
        if (a.itemIds[itemIndex] !== b.itemIds[itemIndex]) {
          return false
        }
      }
    }

    return true
  }

  function commitPreview() {
    if (!previewGroups.value) {
      return
    }

    // 拖拽没有改变顺序时，不需要写回。
    if (isLayoutEqual(groups.value, previewGroups.value)) {
      return
    }

    // 将预览结果提交到真实数据。
    groups.value = cloneGroups(previewGroups.value)
  }

  // 计算落点边界：鼠标在上半区/下半区决定插入位置。
  function resolveDropBoundary(event: DragEvent, itemIndex: number): number {
    const currentTarget = event.currentTarget as HTMLElement | null
    if (!currentTarget) {
      return itemIndex
    }

    const rect = currentTarget.getBoundingClientRect()
    const midpointY = rect.top + rect.height / 2
    return event.clientY >= midpointY ? itemIndex + 1 : itemIndex
  }

  // 根据条目 id 找到它所在的分组与位置。
  function resolveItemLocation(itemId: string, inputGroups: T[]): { groupId: string; index: number } | null {
    for (const group of inputGroups) {
      const index = group.itemIds.indexOf(itemId)
      if (index >= 0) {
        return {
          groupId: group.id,
          index
        }
      }
    }

    return null
  }

  // 同组拖拽时，修正插入索引，避免"自己插到自己前面"的错位。
  function normalizeItemTargetIndex(targetGroupId: string, boundaryIndex: number): number {
    if (!dragItem.value) {
      return boundaryIndex
    }

    const location = resolveItemLocation(dragItem.value.itemId, renderedGroups.value)
    if (!location || location.groupId !== targetGroupId) {
      return boundaryIndex
    }

    return location.index < boundaryIndex ? boundaryIndex - 1 : boundaryIndex
  }

  // 应用分组拖拽的预览重排。
  function applyGroupPreview(boundaryIndex: number) {
    if (!dragGroupId.value) {
      return
    }

    const nextGroups = ensurePreviewGroups()
    const sourceIndex = nextGroups.findIndex((group) => group.id === dragGroupId.value)
    if (sourceIndex < 0) {
      return
    }

    const targetIndex = sourceIndex < boundaryIndex ? boundaryIndex - 1 : boundaryIndex
    const safeTargetIndex = Math.max(0, Math.min(targetIndex, nextGroups.length - 1))
    if (safeTargetIndex === sourceIndex) {
      return
    }

    moveItem(nextGroups, sourceIndex, safeTargetIndex)
  }

  // 应用条目拖拽的预览重排（支持跨组移动）。
  function applyItemPreview(targetGroupId: string, boundaryIndex: number) {
    if (!dragItem.value) {
      return
    }

    const nextGroups = ensurePreviewGroups()
    const sourceLocation = resolveItemLocation(dragItem.value.itemId, nextGroups)
    if (!sourceLocation) {
      return
    }

    const sourceGroup = nextGroups.find((group) => group.id === sourceLocation.groupId)
    const targetGroup = nextGroups.find((group) => group.id === targetGroupId)
    if (!sourceGroup || !targetGroup) {
      return
    }

    if (sourceGroup.id === targetGroup.id) {
      const targetIndex = sourceLocation.index < boundaryIndex ? boundaryIndex - 1 : boundaryIndex
      const safeTargetIndex = Math.max(0, Math.min(targetIndex, sourceGroup.itemIds.length - 1))
      if (safeTargetIndex === sourceLocation.index) {
        return
      }

      moveItem(sourceGroup.itemIds, sourceLocation.index, safeTargetIndex)
      return
    }

    sourceGroup.itemIds.splice(sourceLocation.index, 1)

    const insertIndex = Math.max(0, Math.min(boundaryIndex, targetGroup.itemIds.length))
    targetGroup.itemIds.splice(insertIndex, 0, dragItem.value.itemId)
  }

  // rAF 刷新分组预览：将高频 dragover 合并为每帧一次。
  function flushGroupPreview() {
    groupRafHandle = null

    if (!dragGroupId.value) {
      pendingGroupBoundary = null
      return
    }

    const nextBoundary = pendingGroupBoundary
    pendingGroupBoundary = null
    if (nextBoundary === null) {
      return
    }

    if (groupDropBoundaryIndex.value !== nextBoundary) {
      groupDropBoundaryIndex.value = nextBoundary
      applyGroupPreview(nextBoundary)
    }

    if (pendingGroupBoundary !== null && groupRafHandle === null) {
      groupRafHandle = window.requestAnimationFrame(flushGroupPreview)
    }
  }

  // 记录最新落点，等待下一帧刷新预览。
  function scheduleGroupPreview(boundary: number) {
    pendingGroupBoundary = boundary
    if (groupRafHandle !== null) {
      return
    }
    groupRafHandle = window.requestAnimationFrame(flushGroupPreview)
  }

  function cancelGroupPreviewFrame() {
    pendingGroupBoundary = null
    if (groupRafHandle !== null) {
      window.cancelAnimationFrame(groupRafHandle)
      groupRafHandle = null
    }
  }

  // drop 时同步最后一次落点，避免错过 rAF 更新。
  function syncPendingGroupPreview() {
    if (!dragGroupId.value || pendingGroupBoundary === null) {
      return
    }

    const nextBoundary = pendingGroupBoundary
    pendingGroupBoundary = null
    if (groupDropBoundaryIndex.value !== nextBoundary) {
      groupDropBoundaryIndex.value = nextBoundary
      applyGroupPreview(nextBoundary)
    }
  }

  // rAF 刷新条目预览：同样合并多次 dragover。
  function flushItemPreview() {
    itemRafHandle = null

    if (!dragItem.value) {
      pendingItemTarget = null
      return
    }

    const nextTarget = pendingItemTarget
    pendingItemTarget = null
    if (!nextTarget) {
      return
    }

    if (itemDropTarget.value?.groupId !== nextTarget.groupId || itemDropTarget.value.index !== nextTarget.index) {
      itemDropTarget.value = nextTarget
      applyItemPreview(nextTarget.groupId, nextTarget.index)
    }

    if (pendingItemTarget && itemRafHandle === null) {
      itemRafHandle = window.requestAnimationFrame(flushItemPreview)
    }
  }

  // 记录条目落点，等待下一帧刷新预览。
  function scheduleItemPreview(targetGroupId: string, boundary: number) {
    pendingItemTarget = {
      groupId: targetGroupId,
      index: boundary
    }

    if (itemRafHandle !== null) {
      return
    }
    itemRafHandle = window.requestAnimationFrame(flushItemPreview)
  }

  function cancelItemPreviewFrame() {
    pendingItemTarget = null
    if (itemRafHandle !== null) {
      window.cancelAnimationFrame(itemRafHandle)
      itemRafHandle = null
    }
  }

  // drop 时同步最后一次条目落点，避免错过 rAF 更新。
  function syncPendingItemPreview() {
    if (!dragItem.value || !pendingItemTarget) {
      return
    }

    const nextTarget = pendingItemTarget
    pendingItemTarget = null
    if (itemDropTarget.value?.groupId !== nextTarget.groupId || itemDropTarget.value.index !== nextTarget.index) {
      itemDropTarget.value = nextTarget
      applyItemPreview(nextTarget.groupId, nextTarget.index)
    }
  }

  // 判断元素是否可滚动（有滚动条且内容溢出）。
  function isScrollableContainer(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element)
    const overflowY = style.overflowY
    if (overflowY !== 'auto' && overflowY !== 'scroll' && overflowY !== 'overlay') {
      return false
    }
    return element.scrollHeight > element.clientHeight + 1
  }

  // 从当前元素向上找第一个可滚动容器。
  function resolveAutoScrollContainer(startElement: HTMLElement | null): HTMLElement | null {
    let current: HTMLElement | null = startElement
    while (current) {
      if (isScrollableContainer(current)) {
        return current
      }
      current = current.parentElement
    }

    const fallback = document.scrollingElement
    return fallback instanceof HTMLElement ? fallback : null
  }

  // 根据指针与边缘距离计算滚动步长（越靠近边缘越快）。
  function computeAutoScrollStep(container: HTMLElement, pointerY: number): number {
    const rect = container.getBoundingClientRect()
    const distanceToTop = pointerY - rect.top
    const distanceToBottom = rect.bottom - pointerY

    if (distanceToTop < edgePx) {
      const ratio = Math.min(1, Math.max(0, (edgePx - distanceToTop) / edgePx))
      return -Math.max(1, Math.round(maxStepPx * ratio * ratio))
    }

    if (distanceToBottom < edgePx) {
      const ratio = Math.min(1, Math.max(0, (edgePx - distanceToBottom) / edgePx))
      return Math.max(1, Math.round(maxStepPx * ratio * ratio))
    }

    return 0
  }

  // 自动滚动主循环：若还能滚动则继续下一帧。
  function runAutoScrollFrame() {
    autoScrollRafHandle = null
    if (!hasActiveDrag()) {
      return
    }

    if (!autoScrollContainer || autoScrollPointerY === null) {
      return
    }

    const step = computeAutoScrollStep(autoScrollContainer, autoScrollPointerY)
    if (!step) {
      return
    }

    const before = autoScrollContainer.scrollTop
    autoScrollContainer.scrollTop = before + step
    const after = autoScrollContainer.scrollTop
    if (after === before) {
      return
    }

    autoScrollRafHandle = window.requestAnimationFrame(runAutoScrollFrame)
  }

  // dragover 时触发自动滚动调度。
  function scheduleAutoScroll(event: DragEvent) {
    if (!hasActiveDrag()) {
      return
    }

    const currentTarget = event.currentTarget as HTMLElement | null
    if (!autoScrollContainer || !autoScrollContainer.isConnected) {
      autoScrollContainer = resolveAutoScrollContainer(currentTarget)
    } else if (currentTarget && !autoScrollContainer.contains(currentTarget)) {
      autoScrollContainer = resolveAutoScrollContainer(currentTarget)
    }

    if (!autoScrollContainer) {
      return
    }

    autoScrollPointerY = event.clientY
    if (autoScrollRafHandle === null) {
      autoScrollRafHandle = window.requestAnimationFrame(runAutoScrollFrame)
    }
  }

  // 清理自动滚动状态。
  function resetAutoScrollState() {
    autoScrollPointerY = null
    autoScrollContainer = null
    if (autoScrollRafHandle !== null) {
      window.cancelAnimationFrame(autoScrollRafHandle)
      autoScrollRafHandle = null
    }
  }

  // 清理分组拖拽状态（含预览与自动滚动）。
  function clearGroupDragState() {
    cancelGroupPreviewFrame()
    dragGroupId.value = null
    groupDropBoundaryIndex.value = null
    clearPreviewIfIdle()
    if (!hasActiveDrag()) {
      resetAutoScrollState()
    }
  }

  // 清理条目拖拽状态（含预览与自动滚动）。
  function clearItemDragState() {
    cancelItemPreviewFrame()
    dragItem.value = null
    itemDropTarget.value = null
    clearPreviewIfIdle()
    if (!hasActiveDrag()) {
      resetAutoScrollState()
    }
  }

  // 分组拖拽开始：建立预览，并记录来源分组。
  function onGroupDragStart(index: number) {
    if (dragItem.value) {
      return
    }

    resetAutoScrollState()
    const nextGroups = ensurePreviewGroups()
    const group = nextGroups[index]
    if (!group) {
      return
    }

    dragGroupId.value = group.id
    groupDropBoundaryIndex.value = index
    itemDropTarget.value = null
  }

  // 分组拖拽经过：计算落点并触发预览 + 自动滚动。
  function onGroupDragOver(index: number, event: DragEvent) {
    if (!dragGroupId.value || dragItem.value) {
      return
    }

    const boundary = resolveDropBoundary(event, index)
    scheduleGroupPreview(boundary)
    scheduleAutoScroll(event)
  }

  // 分组拖拽到"末尾区域"时的落点处理。
  function onGroupEndZoneDragOver(event: DragEvent) {
    if (!dragGroupId.value || dragItem.value) {
      return
    }

    const boundary = renderedGroups.value.length
    scheduleGroupPreview(boundary)
    scheduleAutoScroll(event)
  }

  // 分组 drop：同步最后落点、提交预览、清理状态。
  function onGroupDrop() {
    if (!dragGroupId.value || dragItem.value) {
      return
    }

    syncPendingGroupPreview()
    commitPreview()
    clearGroupDragState()
  }

  // 结束/取消拖拽时，清理状态。
  function onGroupDragEnd() {
    clearGroupDragState()
  }

  // 条目拖拽开始：记录条目与来源分组，并初始化落点。
  function onItemDragStart(itemId: string, sourceGroupId: string) {
    clearGroupDragState()
    cancelItemPreviewFrame()
    resetAutoScrollState()

    dragItem.value = {
      itemId,
      sourceGroupId
    }

    ensurePreviewGroups()
    const sourceIndex = renderedGroups.value.find((group) => group.id === sourceGroupId)?.itemIds.indexOf(itemId) ?? -1
    if (sourceIndex >= 0) {
      itemDropTarget.value = {
        groupId: sourceGroupId,
        index: sourceIndex
      }
    }
  }

  // 条目拖拽经过：计算落点并触发预览 + 自动滚动。
  function onItemDragOver(targetGroupId: string, targetIndex: number, event: DragEvent) {
    if (!dragItem.value) {
      return
    }

    const boundary = resolveDropBoundary(event, targetIndex)
    scheduleItemPreview(targetGroupId, boundary)
    scheduleAutoScroll(event)
  }

  // 条目拖拽到"末尾区域"时的落点处理。
  function onItemEndZoneDragOver(targetGroupId: string, event: DragEvent) {
    if (!dragItem.value) {
      return
    }

    const group = renderedGroups.value.find((item) => item.id === targetGroupId)
    if (!group) {
      return
    }

    scheduleItemPreview(targetGroupId, group.itemIds.length)
    scheduleAutoScroll(event)
  }

  // 条目 drop：同步最后落点、提交预览、清理状态。
  function onItemDrop(_targetGroupId: string, _targetIndex: number) {
    if (!dragItem.value) {
      return
    }

    syncPendingItemPreview()
    commitPreview()
    clearItemDragState()
  }

  // 条目拖拽结束：清理状态。
  function onItemDragEnd() {
    clearItemDragState()
  }

  // 是否显示"分组落点虚线"。
  function isGroupDropAnchor(index: number): boolean {
    if (groupDropBoundaryIndex.value === null || !dragGroupId.value) {
      return false
    }

    const sourceIndex = renderedGroups.value.findIndex((group) => group.id === dragGroupId.value)
    if (sourceIndex < 0) {
      return false
    }

    const targetIndex = sourceIndex < groupDropBoundaryIndex.value ? groupDropBoundaryIndex.value - 1 : groupDropBoundaryIndex.value
    if (targetIndex === sourceIndex) {
      return false
    }

    return groupDropBoundaryIndex.value === index
  }

  // 是否显示"分组末尾落点"高亮。
  function isGroupDropAtEnd(): boolean {
    if (groupDropBoundaryIndex.value === null || !dragGroupId.value) {
      return false
    }

    const sourceIndex = renderedGroups.value.findIndex((group) => group.id === dragGroupId.value)
    if (sourceIndex < 0) {
      return false
    }

    const targetIndex = sourceIndex < groupDropBoundaryIndex.value ? groupDropBoundaryIndex.value - 1 : groupDropBoundaryIndex.value
    if (targetIndex === sourceIndex) {
      return false
    }

    return groupDropBoundaryIndex.value === renderedGroups.value.length
  }

  // 是否正在拖拽该条目（用于样式）。
  function isDraggingItem(itemId: string): boolean {
    return dragItem.value?.itemId === itemId
  }

  // 是否显示"条目落点虚线"。
  function isItemDropAnchor(groupId: string, rowIndex: number): boolean {
    if (!dragItem.value || !itemDropTarget.value || itemDropTarget.value.groupId !== groupId) {
      return false
    }

    const normalizedIndex = normalizeItemTargetIndex(groupId, itemDropTarget.value.index)
    const location = resolveItemLocation(dragItem.value.itemId, renderedGroups.value)
    if (location && location.groupId === groupId && normalizedIndex === location.index) {
      return false
    }

    return itemDropTarget.value.index === rowIndex
  }

  // 是否显示"条目末尾落点"高亮。
  function isItemDropAtEnd(groupId: string): boolean {
    if (!dragItem.value || !itemDropTarget.value || itemDropTarget.value.groupId !== groupId) {
      return false
    }

    const group = renderedGroups.value.find((item) => item.id === groupId)
    if (!group || itemDropTarget.value.index !== group.itemIds.length) {
      return false
    }

    const location = resolveItemLocation(dragItem.value.itemId, renderedGroups.value)
    if (!location || location.groupId !== groupId) {
      return true
    }

    const normalizedIndex = normalizeItemTargetIndex(groupId, itemDropTarget.value.index)
    return normalizedIndex !== location.index
  }

  // 组件卸载时清理 rAF 与滚动状态。
  onBeforeUnmount(() => {
    cancelGroupPreviewFrame()
    cancelItemPreviewFrame()
    resetAutoScrollState()
  })

  return {
    renderedGroups,
    dragGroupId,
    dragItem,
    onGroupDragStart,
    onGroupDragOver,
    onGroupEndZoneDragOver,
    onGroupDrop,
    onGroupDragEnd,
    onItemDragStart,
    onItemDragOver,
    onItemEndZoneDragOver,
    onItemDrop,
    onItemDragEnd,
    isGroupDropAnchor,
    isGroupDropAtEnd,
    isDraggingItem,
    isItemDropAnchor,
    isItemDropAtEnd
  }
}
