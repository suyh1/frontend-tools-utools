import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'

export interface DragSortGroup {
  id: string
  itemIds: string[]
}

interface DragItemState {
  itemId: string
  sourceGroupId: string
}

interface DropTarget {
  groupId: string
  index: number
}

export interface UseDragSortAutoScrollOptions {
  edgePx?: number
  maxStepPx?: number
}

interface MutableRef<TValue> {
  value: TValue
}

export function useDragSortAutoScroll<T extends DragSortGroup>(
  groups: MutableRef<T[]>,
  options: UseDragSortAutoScrollOptions = {}
) {
  const edgePx = options.edgePx ?? 56
  const maxStepPx = options.maxStepPx ?? 20

  const dragGroupId = ref<string | null>(null)
  const groupDropBoundaryIndex = ref<number | null>(null)
  const dragItem = ref<DragItemState | null>(null)
  const itemDropTarget = ref<DropTarget | null>(null)
  const previewGroups = shallowRef<T[] | null>(null)

  let groupRafHandle: number | null = null
  let pendingGroupBoundary: number | null = null
  let itemRafHandle: number | null = null
  let pendingItemTarget: DropTarget | null = null

  let autoScrollRafHandle: number | null = null
  let autoScrollPointerY: number | null = null
  let autoScrollContainer: HTMLElement | null = null

  const renderedGroups = computed(() => previewGroups.value ?? groups.value)

  function cloneGroups(input: T[]): T[] {
    return input.map((group) => ({
      ...group,
      itemIds: [...group.itemIds]
    }))
  }

  function ensurePreviewGroups(): T[] {
    if (!previewGroups.value) {
      previewGroups.value = cloneGroups(groups.value)
    }
    return previewGroups.value
  }

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

  function clearPreviewIfIdle() {
    if (!hasActiveDrag()) {
      previewGroups.value = null
    }
  }

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

    if (isLayoutEqual(groups.value, previewGroups.value)) {
      return
    }

    groups.value = cloneGroups(previewGroups.value)
  }

  function resolveDropBoundary(event: DragEvent, itemIndex: number): number {
    const currentTarget = event.currentTarget as HTMLElement | null
    if (!currentTarget) {
      return itemIndex
    }

    const rect = currentTarget.getBoundingClientRect()
    const midpointY = rect.top + rect.height / 2
    return event.clientY >= midpointY ? itemIndex + 1 : itemIndex
  }

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

  function isScrollableContainer(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element)
    const overflowY = style.overflowY
    if (overflowY !== 'auto' && overflowY !== 'scroll' && overflowY !== 'overlay') {
      return false
    }
    return element.scrollHeight > element.clientHeight + 1
  }

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

  function resetAutoScrollState() {
    autoScrollPointerY = null
    autoScrollContainer = null
    if (autoScrollRafHandle !== null) {
      window.cancelAnimationFrame(autoScrollRafHandle)
      autoScrollRafHandle = null
    }
  }

  function clearGroupDragState() {
    cancelGroupPreviewFrame()
    dragGroupId.value = null
    groupDropBoundaryIndex.value = null
    clearPreviewIfIdle()
    if (!hasActiveDrag()) {
      resetAutoScrollState()
    }
  }

  function clearItemDragState() {
    cancelItemPreviewFrame()
    dragItem.value = null
    itemDropTarget.value = null
    clearPreviewIfIdle()
    if (!hasActiveDrag()) {
      resetAutoScrollState()
    }
  }

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

  function onGroupDragOver(index: number, event: DragEvent) {
    if (!dragGroupId.value || dragItem.value) {
      return
    }

    const boundary = resolveDropBoundary(event, index)
    scheduleGroupPreview(boundary)
    scheduleAutoScroll(event)
  }

  function onGroupEndZoneDragOver(event: DragEvent) {
    if (!dragGroupId.value || dragItem.value) {
      return
    }

    const boundary = renderedGroups.value.length
    scheduleGroupPreview(boundary)
    scheduleAutoScroll(event)
  }

  function onGroupDrop() {
    if (!dragGroupId.value || dragItem.value) {
      return
    }

    syncPendingGroupPreview()
    commitPreview()
    clearGroupDragState()
  }

  function onGroupDragEnd() {
    clearGroupDragState()
  }

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

  function onItemDragOver(targetGroupId: string, targetIndex: number, event: DragEvent) {
    if (!dragItem.value) {
      return
    }

    const boundary = resolveDropBoundary(event, targetIndex)
    scheduleItemPreview(targetGroupId, boundary)
    scheduleAutoScroll(event)
  }

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

  function onItemDrop(_targetGroupId: string, _targetIndex: number) {
    if (!dragItem.value) {
      return
    }

    syncPendingItemPreview()
    commitPreview()
    clearItemDragState()
  }

  function onItemDragEnd() {
    clearItemDragState()
  }

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

  function isDraggingItem(itemId: string): boolean {
    return dragItem.value?.itemId === itemId
  }

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
