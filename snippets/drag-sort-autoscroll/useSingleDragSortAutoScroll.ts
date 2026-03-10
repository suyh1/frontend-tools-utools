import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'

// ================================
// 单列表拖拽排序 + 边缘自动滚动（教程）
//
// 适用场景：
// - 扁平数组的排序（只有一列/一个列表）
//
// 最小接入步骤：
// 1) 准备 items 数组（每项有唯一 id）
// 2) const drag = useSingleDragSortAutoScroll(items, { getId })
// 3) 绑定拖拽事件：onItemDragStart / onItemDragOver / onDrop / onDragEnd
// 4) 绑定状态类：isDropAnchor / isDropAtEnd / isDraggingItem
//
// 关键概念：
// - 预览列表：拖拽中先改"预览"，drop 时再提交
// - 落点边界：上半区=插到前面，下半区=插到后面
// - 末尾落点：拖到末尾区域可插入到最后
// - 自动滚动：靠近容器上下边缘自动滚动
// ================================

// 可选参数：getId 用于提取条目 id；可调边缘阈值与滚动步长。
export interface UseSingleDragSortAutoScrollOptions<T> {
  getId: (item: T) => string
  edgePx?: number
  maxStepPx?: number
}

// 兼容 ref / shallowRef 的最小结构。
interface MutableRef<TValue> {
  value: TValue
}

export function useSingleDragSortAutoScroll<T>(
  items: MutableRef<T[]>,
  options: UseSingleDragSortAutoScrollOptions<T>
) {
  // 距离上下边缘多少像素开始自动滚动。
  const edgePx = options.edgePx ?? 56
  // 每帧最大滚动步长（像素）。
  const maxStepPx = options.maxStepPx ?? 20

  // 当前正在拖拽的条目 id。
  const dragItemId = ref<string | null>(null)
  // 当前落点边界（插入位置）。
  const dropBoundaryIndex = ref<number | null>(null)
  // 预览列表：拖拽中实时重排用的临时数组。
  const previewItems = shallowRef<T[] | null>(null)

  // 用 rAF 合并多次 dragover，避免抖动。
  let previewRafHandle: number | null = null
  let pendingBoundary: number | null = null

  // 自动滚动状态：rAF 句柄 + 指针坐标 + 滚动容器。
  let autoScrollRafHandle: number | null = null
  let autoScrollPointerY: number | null = null
  let autoScrollContainer: HTMLElement | null = null

  // 真实渲染用的数据：有预览就用预览，没有就用原数据。
  const renderedItems = computed(() => previewItems.value ?? items.value)

  // 克隆列表，避免直接改动源数据。
  function cloneItems(input: T[]): T[] {
    return [...input]
  }

  // 懒创建预览列表：开始拖拽时再复制一份。
  function ensurePreviewItems(): T[] {
    if (!previewItems.value) {
      previewItems.value = cloneItems(items.value)
    }
    return previewItems.value
  }

  // 简单的数组位移（只在合法范围内生效）。
  function moveItem<TItem>(input: TItem[], fromIndex: number, toIndex: number) {
    if (fromIndex < 0 || fromIndex >= input.length || toIndex < 0 || toIndex >= input.length) {
      return
    }

    const [item] = input.splice(fromIndex, 1)
    input.splice(toIndex, 0, item)
  }

  // 没有拖拽时清掉预览，避免状态残留。
  function clearPreviewIfIdle() {
    if (!dragItemId.value) {
      previewItems.value = null
    }
  }

  // 判断预览与真实数据是否相同，避免无意义提交。
  function isLayoutEqual(left: T[], right: T[]): boolean {
    if (left.length !== right.length) {
      return false
    }

    for (let index = 0; index < left.length; index += 1) {
      if (options.getId(left[index]) !== options.getId(right[index])) {
        return false
      }
    }

    return true
  }

  function commitPreview() {
    if (!previewItems.value) {
      return
    }

    // 拖拽没有改变顺序时，不需要写回。
    if (isLayoutEqual(items.value, previewItems.value)) {
      return
    }

    // 将预览结果提交到真实数据。
    items.value = cloneItems(previewItems.value)
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

  // 根据拖拽条目 id 找到它当前的位置。
  function resolveDragItemIndex(input: T[]): number {
    if (!dragItemId.value) {
      return -1
    }

    return input.findIndex((item) => options.getId(item) === dragItemId.value)
  }

  // 应用预览重排（只改临时预览列表）。
  function applyPreview(boundaryIndex: number) {
    if (!dragItemId.value) {
      return
    }

    const nextItems = ensurePreviewItems()
    const sourceIndex = resolveDragItemIndex(nextItems)
    if (sourceIndex < 0) {
      return
    }

    const targetIndex = sourceIndex < boundaryIndex ? boundaryIndex - 1 : boundaryIndex
    const safeTargetIndex = Math.max(0, Math.min(targetIndex, nextItems.length - 1))
    if (safeTargetIndex === sourceIndex) {
      return
    }

    moveItem(nextItems, sourceIndex, safeTargetIndex)
  }

  // rAF 刷新预览：将高频 dragover 合并为每帧一次。
  function flushPreview() {
    previewRafHandle = null

    if (!dragItemId.value) {
      pendingBoundary = null
      return
    }

    const nextBoundary = pendingBoundary
    pendingBoundary = null
    if (nextBoundary === null) {
      return
    }

    if (dropBoundaryIndex.value !== nextBoundary) {
      dropBoundaryIndex.value = nextBoundary
      applyPreview(nextBoundary)
    }

    if (pendingBoundary !== null && previewRafHandle === null) {
      previewRafHandle = window.requestAnimationFrame(flushPreview)
    }
  }

  // 记录最新落点，等待下一帧刷新预览。
  function schedulePreview(boundary: number) {
    pendingBoundary = boundary
    if (previewRafHandle !== null) {
      return
    }
    previewRafHandle = window.requestAnimationFrame(flushPreview)
  }

  function cancelPreviewFrame() {
    pendingBoundary = null
    if (previewRafHandle !== null) {
      window.cancelAnimationFrame(previewRafHandle)
      previewRafHandle = null
    }
  }

  // drop 时同步最后一次落点，避免错过 rAF 更新。
  function syncPendingPreview() {
    if (!dragItemId.value || pendingBoundary === null) {
      return
    }

    const nextBoundary = pendingBoundary
    pendingBoundary = null
    if (dropBoundaryIndex.value !== nextBoundary) {
      dropBoundaryIndex.value = nextBoundary
      applyPreview(nextBoundary)
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

    if (!dragItemId.value || !autoScrollContainer || autoScrollPointerY === null) {
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
    if (!dragItemId.value) {
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

  // 清理拖拽状态（含预览与自动滚动）。
  function clearDragState() {
    cancelPreviewFrame()
    dragItemId.value = null
    dropBoundaryIndex.value = null
    clearPreviewIfIdle()
    resetAutoScrollState()
  }

  // 拖拽开始：建立预览并记录来源位置。
  function onItemDragStart(index: number) {
    resetAutoScrollState()
    const nextItems = ensurePreviewItems()
    const item = nextItems[index]
    if (!item) {
      return
    }

    dragItemId.value = options.getId(item)
    dropBoundaryIndex.value = index
  }

  // 拖拽经过：计算落点并触发预览 + 自动滚动。
  function onItemDragOver(index: number, event: DragEvent) {
    if (!dragItemId.value) {
      return
    }

    const boundary = resolveDropBoundary(event, index)
    schedulePreview(boundary)
    scheduleAutoScroll(event)
  }

  // 拖拽到"末尾区域"时的落点处理。
  function onEndZoneDragOver(event: DragEvent) {
    if (!dragItemId.value) {
      return
    }

    schedulePreview(renderedItems.value.length)
    scheduleAutoScroll(event)
  }

  // drop：同步最后落点、提交预览、清理状态。
  function onDrop() {
    if (!dragItemId.value) {
      return
    }

    syncPendingPreview()
    commitPreview()
    clearDragState()
  }

  // 拖拽结束：清理状态。
  function onDragEnd() {
    clearDragState()
  }

  // 是否正在拖拽该条目（用于样式）。
  function isDraggingItem(itemId: string): boolean {
    return dragItemId.value === itemId
  }

  // 是否显示"落点虚线"。
  function isDropAnchor(rowIndex: number): boolean {
    if (dropBoundaryIndex.value === null || !dragItemId.value) {
      return false
    }

    const sourceIndex = resolveDragItemIndex(renderedItems.value)
    if (sourceIndex < 0) {
      return false
    }

    const targetIndex = sourceIndex < dropBoundaryIndex.value ? dropBoundaryIndex.value - 1 : dropBoundaryIndex.value
    if (targetIndex === sourceIndex) {
      return false
    }

    return dropBoundaryIndex.value === rowIndex
  }

  // 是否显示"末尾落点"高亮。
  function isDropAtEnd(): boolean {
    if (dropBoundaryIndex.value === null || !dragItemId.value) {
      return false
    }

    const sourceIndex = resolveDragItemIndex(renderedItems.value)
    if (sourceIndex < 0) {
      return false
    }

    const targetIndex = sourceIndex < dropBoundaryIndex.value ? dropBoundaryIndex.value - 1 : dropBoundaryIndex.value
    if (targetIndex === sourceIndex) {
      return false
    }

    return dropBoundaryIndex.value === renderedItems.value.length
  }

  // 组件卸载时清理 rAF 与滚动状态。
  onBeforeUnmount(() => {
    cancelPreviewFrame()
    resetAutoScrollState()
  })

  return {
    renderedItems,
    dragItemId,
    onItemDragStart,
    onItemDragOver,
    onEndZoneDragOver,
    onDrop,
    onDragEnd,
    isDraggingItem,
    isDropAnchor,
    isDropAtEnd
  }
}
