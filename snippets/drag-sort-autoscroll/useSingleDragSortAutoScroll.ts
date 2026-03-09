import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'

export interface UseSingleDragSortAutoScrollOptions<T> {
  getId: (item: T) => string
  edgePx?: number
  maxStepPx?: number
}

interface MutableRef<TValue> {
  value: TValue
}

export function useSingleDragSortAutoScroll<T>(
  items: MutableRef<T[]>,
  options: UseSingleDragSortAutoScrollOptions<T>
) {
  const edgePx = options.edgePx ?? 56
  const maxStepPx = options.maxStepPx ?? 20

  const dragItemId = ref<string | null>(null)
  const dropBoundaryIndex = ref<number | null>(null)
  const previewItems = shallowRef<T[] | null>(null)

  let previewRafHandle: number | null = null
  let pendingBoundary: number | null = null

  let autoScrollRafHandle: number | null = null
  let autoScrollPointerY: number | null = null
  let autoScrollContainer: HTMLElement | null = null

  const renderedItems = computed(() => previewItems.value ?? items.value)

  function cloneItems(input: T[]): T[] {
    return [...input]
  }

  function ensurePreviewItems(): T[] {
    if (!previewItems.value) {
      previewItems.value = cloneItems(items.value)
    }
    return previewItems.value
  }

  function moveItem<TItem>(input: TItem[], fromIndex: number, toIndex: number) {
    if (fromIndex < 0 || fromIndex >= input.length || toIndex < 0 || toIndex >= input.length) {
      return
    }

    const [item] = input.splice(fromIndex, 1)
    input.splice(toIndex, 0, item)
  }

  function clearPreviewIfIdle() {
    if (!dragItemId.value) {
      previewItems.value = null
    }
  }

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

    if (isLayoutEqual(items.value, previewItems.value)) {
      return
    }

    items.value = cloneItems(previewItems.value)
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

  function resolveDragItemIndex(input: T[]): number {
    if (!dragItemId.value) {
      return -1
    }

    return input.findIndex((item) => options.getId(item) === dragItemId.value)
  }

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

  function resetAutoScrollState() {
    autoScrollPointerY = null
    autoScrollContainer = null
    if (autoScrollRafHandle !== null) {
      window.cancelAnimationFrame(autoScrollRafHandle)
      autoScrollRafHandle = null
    }
  }

  function clearDragState() {
    cancelPreviewFrame()
    dragItemId.value = null
    dropBoundaryIndex.value = null
    clearPreviewIfIdle()
    resetAutoScrollState()
  }

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

  function onItemDragOver(index: number, event: DragEvent) {
    if (!dragItemId.value) {
      return
    }

    const boundary = resolveDropBoundary(event, index)
    schedulePreview(boundary)
    scheduleAutoScroll(event)
  }

  function onEndZoneDragOver(event: DragEvent) {
    if (!dragItemId.value) {
      return
    }

    schedulePreview(renderedItems.value.length)
    scheduleAutoScroll(event)
  }

  function onDrop() {
    if (!dragItemId.value) {
      return
    }

    syncPendingPreview()
    commitPreview()
    clearDragState()
  }

  function onDragEnd() {
    clearDragState()
  }

  function isDraggingItem(itemId: string): boolean {
    return dragItemId.value === itemId
  }

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
