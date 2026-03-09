<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { NButton, NCheckbox, NDrawer, NDrawerContent, NInput, NSelect, NTag, NText } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { parseImportedToolLayoutText, serializeToolLayoutConfig } from '@/tools/layout/import-export'
import type { ToolLayoutGroup } from '@/tools/layout/types'
import { toolRegistryMap } from '@/tools/registry'
import { useToolLayoutStore } from '@/stores/tool-layout'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (event: 'update:show', value: boolean): void
}>()

const toolLayoutStore = useToolLayoutStore()

const showModel = computed({
  get: () => props.show,
  set: (value: boolean) => emit('update:show', value)
})

const newGroupName = ref('')
const importInputRef = ref<HTMLInputElement | null>(null)
const dragGroupId = ref<string | null>(null)
const groupDropBoundaryIndex = ref<number | null>(null)
const dragTool = ref<{ toolId: string; sourceGroupId: string } | null>(null)
const toolDropTarget = ref<{ groupId: string; index: number } | null>(null)
const previewGroups = ref<ToolLayoutGroup[] | null>(null)
let groupRafHandle: number | null = null
let pendingGroupBoundary: number | null = null
let toolRafHandle: number | null = null
let pendingToolTarget: { groupId: string; index: number } | null = null
let autoScrollRafHandle: number | null = null
let autoScrollPointerY: number | null = null
let autoScrollContainer: HTMLElement | null = null
const AUTO_SCROLL_EDGE_PX = 56
const AUTO_SCROLL_MAX_STEP_PX = 20

const groupOptions = computed<SelectOption[]>(() =>
  toolLayoutStore.effectiveConfig.groups.map((group) => ({
    label: group.name,
    value: group.id
  }))
)

const groupCount = computed(() => toolLayoutStore.effectiveConfig.groups.length)
const toolCount = computed(() =>
  toolLayoutStore.effectiveConfig.groups.reduce((total, group) => total + group.toolIds.length, 0)
)
const favoriteCount = computed(() => toolLayoutStore.effectiveConfig.favorites.length)
const hiddenCount = computed(() => toolLayoutStore.effectiveConfig.hiddenTools.length)
const renderedGroups = computed(() => previewGroups.value ?? toolLayoutStore.effectiveConfig.groups)

function cloneGroups(groups: ToolLayoutGroup[]): ToolLayoutGroup[] {
  return groups.map((group) => ({
    ...group,
    toolIds: [...group.toolIds]
  }))
}

function ensurePreviewGroups(): ToolLayoutGroup[] {
  if (!previewGroups.value) {
    previewGroups.value = cloneGroups(toolLayoutStore.effectiveConfig.groups)
  }
  return previewGroups.value
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) {
    return
  }
  const [item] = items.splice(fromIndex, 1)
  items.splice(toIndex, 0, item)
}

function clearPreviewIfIdle() {
  if (!dragTool.value && !dragGroupId.value) {
    previewGroups.value = null
  }
}

function hasActiveDrag(): boolean {
  return Boolean(dragGroupId.value || dragTool.value)
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

  if (distanceToTop < AUTO_SCROLL_EDGE_PX) {
    const ratio = Math.min(1, Math.max(0, (AUTO_SCROLL_EDGE_PX - distanceToTop) / AUTO_SCROLL_EDGE_PX))
    return -Math.max(1, Math.round(AUTO_SCROLL_MAX_STEP_PX * ratio * ratio))
  }

  if (distanceToBottom < AUTO_SCROLL_EDGE_PX) {
    const ratio = Math.min(1, Math.max(0, (AUTO_SCROLL_EDGE_PX - distanceToBottom) / AUTO_SCROLL_EDGE_PX))
    return Math.max(1, Math.round(AUTO_SCROLL_MAX_STEP_PX * ratio * ratio))
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

function flushToolPreview() {
  toolRafHandle = null
  if (!dragTool.value) {
    pendingToolTarget = null
    return
  }

  const nextTarget = pendingToolTarget
  pendingToolTarget = null
  if (!nextTarget) {
    return
  }

  if (toolDropTarget.value?.groupId !== nextTarget.groupId || toolDropTarget.value.index !== nextTarget.index) {
    toolDropTarget.value = nextTarget
    applyToolPreview(nextTarget.groupId, nextTarget.index)
  }

  if (pendingToolTarget && toolRafHandle === null) {
    toolRafHandle = window.requestAnimationFrame(flushToolPreview)
  }
}

function scheduleToolPreview(targetGroupId: string, boundary: number) {
  pendingToolTarget = {
    groupId: targetGroupId,
    index: boundary
  }

  if (toolRafHandle !== null) {
    return
  }
  toolRafHandle = window.requestAnimationFrame(flushToolPreview)
}

function cancelToolPreviewFrame() {
  pendingToolTarget = null
  if (toolRafHandle !== null) {
    window.cancelAnimationFrame(toolRafHandle)
    toolRafHandle = null
  }
}

function syncPendingToolPreview() {
  if (!dragTool.value || !pendingToolTarget) {
    return
  }

  const nextTarget = pendingToolTarget
  pendingToolTarget = null
  if (toolDropTarget.value?.groupId !== nextTarget.groupId || toolDropTarget.value.index !== nextTarget.index) {
    toolDropTarget.value = nextTarget
    applyToolPreview(nextTarget.groupId, nextTarget.index)
  }
}

function notify(message: string) {
  const fallback = (text: string) => console.info(text)
  const push = window.utools?.showNotification ?? fallback
  push(message)
}

function closeDrawer() {
  showModel.value = false
}

function addGroup() {
  if (!newGroupName.value.trim()) {
    return
  }
  toolLayoutStore.addGroup(newGroupName.value)
  newGroupName.value = ''
}

function renameGroup(groupId: string, name: string) {
  toolLayoutStore.renameGroup(groupId, name)
}

function removeGroup(groupId: string) {
  const groups = toolLayoutStore.effectiveConfig.groups
  const targets = groups.filter((item) => item.id !== groupId)
  if (!targets.length) {
    notify('至少保留一个分组')
    return
  }

  const defaultTarget = targets[0].id
  toolLayoutStore.removeGroup(groupId, defaultTarget)
}

function onGroupDragStart(index: number) {
  if (dragTool.value) {
    return
  }
  resetAutoScrollState()

  const groups = ensurePreviewGroups()
  const group = groups[index]
  if (!group) {
    return
  }

  dragGroupId.value = group.id
  groupDropBoundaryIndex.value = index
  toolDropTarget.value = null
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

function resolveGroupTargetIndex(boundaryIndex: number): number | null {
  if (!dragGroupId.value) {
    return null
  }

  const groupCount = renderedGroups.value.length
  if (!groupCount) {
    return null
  }

  const sourceIndex = renderedGroups.value.findIndex((item) => item.id === dragGroupId.value)
  if (sourceIndex < 0) {
    return null
  }
  const adjustedIndex = sourceIndex < boundaryIndex ? boundaryIndex - 1 : boundaryIndex
  return Math.max(0, Math.min(adjustedIndex, groupCount - 1))
}

function applyGroupPreview(boundaryIndex: number) {
  if (!dragGroupId.value) {
    return
  }

  const groups = ensurePreviewGroups()
  const sourceIndex = groups.findIndex((item) => item.id === dragGroupId.value)
  if (sourceIndex < 0) {
    return
  }

  const targetIndex = sourceIndex < boundaryIndex ? boundaryIndex - 1 : boundaryIndex
  const safeTargetIndex = Math.max(0, Math.min(targetIndex, groups.length - 1))
  if (safeTargetIndex === sourceIndex) {
    return
  }

  moveItem(groups, sourceIndex, safeTargetIndex)
}

function onGroupDragOver(index: number, event: DragEvent) {
  if (!dragGroupId.value || dragTool.value) {
    return
  }
  const boundary = resolveDropBoundary(event, index)
  scheduleGroupPreview(boundary)
  scheduleAutoScroll(event)
}

function onGroupEndZoneDragOver(event: DragEvent) {
  if (!dragGroupId.value || dragTool.value) {
    return
  }
  const boundary = renderedGroups.value.length
  scheduleGroupPreview(boundary)
  scheduleAutoScroll(event)
}

function isGroupDropAnchor(index: number): boolean {
  if (groupDropBoundaryIndex.value === null || !dragGroupId.value) {
    return false
  }

  const targetIndex = resolveGroupTargetIndex(groupDropBoundaryIndex.value)
  const sourceIndex = renderedGroups.value.findIndex((item) => item.id === dragGroupId.value)
  if (targetIndex === null || sourceIndex < 0 || targetIndex === sourceIndex) {
    return false
  }

  return groupDropBoundaryIndex.value === index
}

function isGroupDropAtEnd(): boolean {
  if (groupDropBoundaryIndex.value === null || !dragGroupId.value) {
    return false
  }

  const targetIndex = resolveGroupTargetIndex(groupDropBoundaryIndex.value)
  const sourceIndex = renderedGroups.value.findIndex((item) => item.id === dragGroupId.value)
  if (targetIndex === null || sourceIndex < 0 || targetIndex === sourceIndex) {
    return false
  }

  return groupDropBoundaryIndex.value === renderedGroups.value.length
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

function onGroupDrop() {
  if (!dragGroupId.value || dragTool.value) {
    return
  }
  syncPendingGroupPreview()

  const finalIndex = renderedGroups.value.findIndex((item) => item.id === dragGroupId.value)
  const originIndex = toolLayoutStore.effectiveConfig.groups.findIndex((item) => item.id === dragGroupId.value)
  if (finalIndex >= 0 && originIndex >= 0 && finalIndex !== originIndex) {
    toolLayoutStore.reorderGroups(originIndex, finalIndex)
  }

  clearGroupDragState()
}

function onGroupDragEnd() {
  clearGroupDragState()
}

function onToolDragStart(toolId: string, sourceGroupId: string) {
  clearGroupDragState()
  cancelToolPreviewFrame()
  resetAutoScrollState()
  dragTool.value = {
    toolId,
    sourceGroupId
  }
  ensurePreviewGroups()
  const sourceIndex = resolveToolIndexInGroup(sourceGroupId, toolId)
  if (sourceIndex !== null) {
    toolDropTarget.value = {
      groupId: sourceGroupId,
      index: sourceIndex
    }
  }
}

function resolveToolIndexInGroup(groupId: string, toolId: string): number | null {
  const group = renderedGroups.value.find((item) => item.id === groupId)
  if (!group) {
    return null
  }
  const index = group.toolIds.indexOf(toolId)
  return index >= 0 ? index : null
}

function resolveToolLocation(toolId: string, groups: ToolLayoutGroup[]): { groupId: string; index: number } | null {
  for (const group of groups) {
    const index = group.toolIds.indexOf(toolId)
    if (index >= 0) {
      return {
        groupId: group.id,
        index
      }
    }
  }
  return null
}

function normalizeToolTargetIndex(targetGroupId: string, boundaryIndex: number): number {
  if (!dragTool.value) {
    return boundaryIndex
  }

  const location = resolveToolLocation(dragTool.value.toolId, renderedGroups.value)
  if (!location || location.groupId !== targetGroupId) {
    return boundaryIndex
  }

  return location.index < boundaryIndex ? boundaryIndex - 1 : boundaryIndex
}

function applyToolPreview(targetGroupId: string, boundaryIndex: number) {
  if (!dragTool.value) {
    return
  }

  const groups = ensurePreviewGroups()
  const sourceLocation = resolveToolLocation(dragTool.value.toolId, groups)
  if (!sourceLocation) {
    return
  }

  const sourceGroup = groups.find((item) => item.id === sourceLocation.groupId)
  const targetGroup = groups.find((item) => item.id === targetGroupId)
  if (!sourceGroup || !targetGroup) {
    return
  }

  sourceGroup.toolIds.splice(sourceLocation.index, 1)

  let insertIndex = Math.max(0, Math.min(boundaryIndex, targetGroup.toolIds.length))
  if (sourceGroup.id === targetGroup.id && sourceLocation.index < boundaryIndex) {
    insertIndex -= 1
  }
  insertIndex = Math.max(0, Math.min(insertIndex, targetGroup.toolIds.length))
  if (sourceGroup.id === targetGroup.id && sourceLocation.index === insertIndex) {
    return
  }

  targetGroup.toolIds.splice(insertIndex, 0, dragTool.value.toolId)
}

function onToolDragOver(targetGroupId: string, targetIndex: number, event: DragEvent) {
  if (!dragTool.value) {
    return
  }

  const boundary = resolveDropBoundary(event, targetIndex)
  scheduleToolPreview(targetGroupId, boundary)
  scheduleAutoScroll(event)
}

function onToolEndZoneDragOver(targetGroupId: string, event: DragEvent) {
  if (!dragTool.value) {
    return
  }

  const group = renderedGroups.value.find((item) => item.id === targetGroupId)
  if (!group) {
    return
  }

  const boundary = group.toolIds.length
  scheduleToolPreview(targetGroupId, boundary)
  scheduleAutoScroll(event)
}

function isDraggingTool(toolId: string): boolean {
  return dragTool.value?.toolId === toolId
}

function isToolDropAnchor(groupId: string, rowIndex: number): boolean {
  if (!dragTool.value || !toolDropTarget.value || toolDropTarget.value.groupId !== groupId) {
    return false
  }

  const normalizedIndex = normalizeToolTargetIndex(groupId, toolDropTarget.value.index)
  const location = resolveToolLocation(dragTool.value.toolId, renderedGroups.value)
  if (location && location.groupId === groupId && normalizedIndex === location.index) {
    return false
  }

  return toolDropTarget.value.index === rowIndex
}

function isToolDropAtEnd(groupId: string): boolean {
  if (!dragTool.value || !toolDropTarget.value || toolDropTarget.value.groupId !== groupId) {
    return false
  }

  const group = renderedGroups.value.find((item) => item.id === groupId)
  if (!group) {
    return false
  }

  if (toolDropTarget.value.index !== group.toolIds.length) {
    return false
  }

  const location = resolveToolLocation(dragTool.value.toolId, renderedGroups.value)
  if (!location || location.groupId !== groupId) {
    return true
  }

  const normalizedIndex = normalizeToolTargetIndex(groupId, toolDropTarget.value.index)
  return normalizedIndex !== location.index
}

function clearToolDragState() {
  cancelToolPreviewFrame()
  dragTool.value = null
  toolDropTarget.value = null
  clearPreviewIfIdle()
  if (!hasActiveDrag()) {
    resetAutoScrollState()
  }
}

function onToolDrop(_targetGroupId: string, _targetIndex: number) {
  if (!dragTool.value) {
    return
  }
  syncPendingToolPreview()

  const finalLocation = resolveToolLocation(dragTool.value.toolId, renderedGroups.value)
  const originalLocation = resolveToolLocation(dragTool.value.toolId, toolLayoutStore.effectiveConfig.groups)

  if (
    finalLocation &&
    originalLocation &&
    (finalLocation.groupId !== originalLocation.groupId || finalLocation.index !== originalLocation.index)
  ) {
    toolLayoutStore.moveTool(dragTool.value.toolId, finalLocation.groupId, finalLocation.index)
  }

  clearToolDragState()
}

function onToolDragEnd() {
  clearToolDragState()
}

onBeforeUnmount(() => {
  resetAutoScrollState()
})

function setFavorite(toolId: string, checked: boolean) {
  toolLayoutStore.setToolFavorite(toolId, checked)
}

function setHidden(toolId: string, checked: boolean) {
  toolLayoutStore.setToolHidden(toolId, checked)
}

function setAlias(toolId: string, value: string) {
  toolLayoutStore.setToolAlias(toolId, value)
}

function setIcon(toolId: string, value: string) {
  toolLayoutStore.setToolIcon(toolId, value)
}

function triggerImport() {
  importInputRef.value?.click()
}

async function handleImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  const text = await file.text()
  const parsed = parseImportedToolLayoutText(text)
  if (!parsed.ok) {
    notify(parsed.error)
    input.value = ''
    return
  }

  toolLayoutStore.applyImportedConfig(parsed.config)
  notify('配置导入成功')
  input.value = ''
}

function handleExport() {
  const text = serializeToolLayoutConfig(toolLayoutStore.effectiveConfig)
  const filePath = window.services?.writeTextFile?.(text)
  if (filePath) {
    notify(`配置已导出：${filePath}`)
  } else {
    notify('配置已导出')
  }
}

function restoreDefault() {
  const accepted = typeof window.confirm === 'function' ? window.confirm('确认恢复默认工具布局？') : true
  if (!accepted) {
    return
  }

  toolLayoutStore.resetToDefault()
  notify('已恢复默认布局')
}

function isFavorite(toolId: string): boolean {
  return toolLayoutStore.effectiveConfig.favorites.includes(toolId)
}

function isHidden(toolId: string): boolean {
  return toolLayoutStore.effectiveConfig.hiddenTools.includes(toolId)
}

function resolveAlias(toolId: string): string {
  return toolLayoutStore.effectiveConfig.aliases[toolId] ?? ''
}

function resolveIcon(toolId: string): string {
  return toolLayoutStore.effectiveConfig.icons[toolId] ?? ''
}

function resolveToolName(toolId: string): string {
  return toolRegistryMap.get(toolId)?.name ?? toolId
}

function resolveBaseIcon(toolId: string): string {
  return toolRegistryMap.get(toolId)?.icon ?? 'T'
}
</script>

<template>
  <n-drawer v-model:show="showModel" width="min(980px, 94vw)" placement="right" :mask-closable="false">
    <n-drawer-content title="工具管理" closable>
      <input ref="importInputRef" type="file" accept="application/json" class="tool-manager__import-input" @change="handleImport" />

      <div class="tool-manager">
        <section class="tool-manager__hero">
          <div class="tool-manager__hero-main">
            <p class="tool-manager__eyebrow">Tool Layout Console</p>
            <h3 class="tool-manager__title">布局管理台</h3>
            <p class="tool-manager__desc">拖拽分组和工具即可重排，左侧完成分组与配置操作，右侧实时调整每个工具的展示策略。</p>
          </div>

          <div class="tool-manager__stats" aria-label="布局统计">
            <article class="tool-manager__stat-card">
              <span class="tool-manager__stat-label">分组</span>
              <strong class="tool-manager__stat-value">{{ groupCount }}</strong>
            </article>
            <article class="tool-manager__stat-card">
              <span class="tool-manager__stat-label">工具</span>
              <strong class="tool-manager__stat-value">{{ toolCount }}</strong>
            </article>
            <article class="tool-manager__stat-card">
              <span class="tool-manager__stat-label">收藏</span>
              <strong class="tool-manager__stat-value">{{ favoriteCount }}</strong>
            </article>
            <article class="tool-manager__stat-card">
              <span class="tool-manager__stat-label">隐藏</span>
              <strong class="tool-manager__stat-value">{{ hiddenCount }}</strong>
            </article>
          </div>
        </section>

        <div class="tool-manager__workspace">
          <aside class="tool-manager__rail">
            <section class="tool-manager__panel">
              <div class="tool-manager__panel-head">
                <n-text class="tool-manager__panel-title" strong>新增分组</n-text>
              </div>
              <n-input
                v-model:value="newGroupName"
                size="small"
                placeholder="输入新分组名称"
                data-testid="add-group-input"
              />
              <n-button size="small" type="primary" @click="addGroup" data-testid="add-group-button">新增分组</n-button>
            </section>

            <section class="tool-manager__panel">
              <div class="tool-manager__panel-head">
                <n-text class="tool-manager__panel-title" strong>配置操作</n-text>
              </div>

              <div class="tool-manager__action-list">
                <n-button size="small" quaternary class="tool-manager__action-btn" @click="handleExport" data-testid="export-layout-button">
                  ⇪ 导出配置
                </n-button>
                <n-button size="small" quaternary class="tool-manager__action-btn" @click="triggerImport" data-testid="import-layout-button">
                  ⇩ 导入配置
                </n-button>
                <n-button
                  size="small"
                  quaternary
                  type="error"
                  class="tool-manager__action-btn tool-manager__action-btn--danger"
                  @click="restoreDefault"
                  data-testid="reset-layout-button"
                >
                  ↺ 恢复默认
                </n-button>
              </div>
            </section>
          </aside>

          <section class="tool-manager__canvas">
            <transition-group name="tool-manager-group" tag="div" class="tool-manager__group-list">
              <article
                v-for="(group, groupIndex) in renderedGroups"
                :key="group.id"
                class="tool-manager__group"
                :class="{
                  'tool-manager__group--dragging': dragGroupId === group.id,
                  'tool-manager__group--drop-anchor': isGroupDropAnchor(groupIndex)
                }"
                draggable="true"
                @dragstart="onGroupDragStart(groupIndex)"
                @dragover.prevent="(event) => onGroupDragOver(groupIndex, event)"
                @drop="onGroupDrop"
                @dragend="onGroupDragEnd"
                :data-testid="`group-${group.id}`"
              >
                <header class="tool-manager__group-head">
                  <n-tag size="small" round>{{ groupIndex + 1 }}</n-tag>
                  <n-input
                    class="tool-manager__group-name-input"
                    :value="group.name"
                    size="small"
                    placeholder="分组名称"
                    @update:value="(value) => renameGroup(group.id, value)"
                  />
                  <n-select
                    v-if="groupOptions.length > 1"
                    class="tool-manager__group-migrate-select"
                    :options="groupOptions.filter((item) => item.value !== group.id)"
                    size="small"
                    placeholder="迁移目标"
                    :value="undefined"
                    @update:value="(value) => value && toolLayoutStore.removeGroup(group.id, String(value))"
                    :data-testid="`group-migrate-${group.id}`"
                  />
                  <n-button size="small" quaternary class="tool-manager__delete-btn" @click="removeGroup(group.id)" :data-testid="`remove-group-${group.id}`">
                    删除
                  </n-button>
                </header>
                <n-text depth="3" class="tool-manager__group-meta">共 {{ group.toolIds.length }} 个工具，可拖拽调整顺序</n-text>

                <div class="tool-manager__tools">
                  <transition-group name="tool-manager-tool" tag="div" class="tool-manager__tool-list">
                    <div
                      v-for="(toolId, toolIndex) in group.toolIds"
                      :key="toolId"
                      class="tool-manager__tool-row"
                      :class="{
                        'tool-manager__tool-row--dragging': isDraggingTool(toolId),
                        'tool-manager__tool-row--drop-anchor': isToolDropAnchor(group.id, toolIndex)
                      }"
                      draggable="true"
                      @dragstart="onToolDragStart(toolId, group.id)"
                      @dragover.prevent="(event) => onToolDragOver(group.id, toolIndex, event)"
                      @drop="onToolDrop(group.id, toolIndex)"
                      @dragend="onToolDragEnd"
                      :data-testid="`tool-row-${toolId}`"
                    >
                      <div class="tool-manager__tool-main">
                        <span class="tool-manager__tool-icon">{{ resolveIcon(toolId) || resolveBaseIcon(toolId) }}</span>
                        <div class="tool-manager__tool-meta">
                          <n-text>{{ resolveToolName(toolId) }}</n-text>
                          <n-text depth="3" class="tool-manager__tool-id">{{ toolId }}</n-text>
                        </div>
                      </div>

                      <div class="tool-manager__tool-controls">
                        <div class="tool-manager__inline-field">
                          <n-input
                            :value="resolveAlias(toolId)"
                            size="small"
                            placeholder="别名"
                            @update:value="(value) => setAlias(toolId, value)"
                            :data-testid="`alias-input-${toolId}`"
                          />
                        </div>

                        <span class="tool-manager__control-divider" aria-hidden="true"></span>

                        <div class="tool-manager__inline-field tool-manager__inline-field--icon">
                          <n-input
                            :value="resolveIcon(toolId)"
                            size="small"
                            placeholder="图标"
                            @update:value="(value) => setIcon(toolId, value)"
                            :data-testid="`icon-input-${toolId}`"
                          />
                        </div>

                        <span class="tool-manager__control-divider" aria-hidden="true"></span>

                        <label class="tool-manager__toggle-pill">
                          <n-checkbox
                            :checked="isFavorite(toolId)"
                            size="small"
                            @update:checked="(value) => setFavorite(toolId, value)"
                            :data-testid="`favorite-checkbox-${toolId}`"
                          >
                            收藏
                          </n-checkbox>
                        </label>

                        <label class="tool-manager__toggle-pill">
                          <n-checkbox
                            :checked="isHidden(toolId)"
                            size="small"
                            @update:checked="(value) => setHidden(toolId, value)"
                            :data-testid="`hidden-checkbox-${toolId}`"
                          >
                            隐藏
                          </n-checkbox>
                        </label>
                      </div>
                    </div>
                  </transition-group>

                  <div
                    class="tool-manager__drop-zone"
                    :class="{ 'tool-manager__drop-zone--active': isToolDropAtEnd(group.id) }"
                    @dragover.prevent="(event) => onToolEndZoneDragOver(group.id, event)"
                    @drop="onToolDrop(group.id, group.toolIds.length)"
                  >
                    <n-text depth="3" class="tool-manager__drop-hint">拖拽到此处放到分组末尾</n-text>
                  </div>
                </div>
              </article>
            </transition-group>

            <div
              class="tool-manager__group-end-zone"
              :class="{ 'tool-manager__group-end-zone--active': isGroupDropAtEnd() }"
              @dragover.prevent="onGroupEndZoneDragOver"
              @drop="onGroupDrop"
            >
              <n-text depth="3" class="tool-manager__drop-hint">拖拽到此处放到分组末尾</n-text>
            </div>
          </section>
        </div>

        <footer class="tool-manager__footer">
          <n-button size="small" secondary @click="closeDrawer">完成</n-button>
        </footer>
      </div>
    </n-drawer-content>
  </n-drawer>
</template>

<style scoped>
.tool-manager__import-input {
  display: none;
}

.tool-manager {
  display: grid;
  gap: 10px;
}

.tool-manager__hero {
  border-radius: 14px;
  border: 1px solid rgb(255 255 255 / 82%);
  background: linear-gradient(125deg, rgb(11 42 99 / 10%), rgb(16 185 129 / 10%), rgb(255 255 255 / 68%));
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 78%);
  backdrop-filter: blur(10px);
  padding: 12px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
}

.tool-manager__hero-main {
  min-width: 0;
}

.tool-manager__eyebrow {
  margin: 0;
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgb(51 65 85 / 78%);
}

.tool-manager__title {
  margin: 3px 0 0;
  font-size: 16px;
  line-height: 1.2;
  color: #0f172a;
}

.tool-manager__desc {
  margin: 6px 0 0;
  font-size: 12px;
  color: rgb(51 65 85 / 88%);
  line-height: 1.4;
}

.tool-manager__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(88px, 1fr));
  gap: 6px;
}

.tool-manager__stat-card {
  border-radius: 10px;
  border: 1px solid rgb(148 163 184 / 26%);
  background: rgb(255 255 255 / 66%);
  padding: 7px 9px;
  display: grid;
  gap: 2px;
}

.tool-manager__stat-label {
  font-size: 10px;
  color: rgb(71 85 105 / 90%);
}

.tool-manager__stat-value {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.tool-manager__workspace {
  display: grid;
  grid-template-columns: minmax(200px, 240px) minmax(0, 1fr);
  gap: 10px;
  min-height: 0;
}

.tool-manager__rail {
  display: grid;
  grid-template-rows: auto auto;
  align-content: start;
  gap: 10px;
}

.tool-manager__panel {
  border-radius: 12px;
  border: 1px solid rgb(226 232 240 / 88%);
  background: linear-gradient(150deg, rgb(255 255 255 / 78%), rgb(255 255 255 / 56%));
  box-shadow: 0 10px 20px rgb(15 23 42 / 5%);
  padding: 10px;
  display: grid;
  gap: 8px;
}

.tool-manager__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tool-manager__panel-title {
  font-size: 12px;
  color: #1e293b;
}

.tool-manager__action-list {
  display: grid;
  gap: 6px;
}

.tool-manager__action-btn {
  justify-content: flex-start;
  border-radius: 8px;
  border: 1px solid rgb(203 213 225 / 64%);
  background: rgb(255 255 255 / 58%);
  font-size: 12px;
}

.tool-manager__action-btn--danger {
  color: #b42318;
}

.tool-manager__canvas {
  min-height: 0;
  display: grid;
  align-content: start;
  gap: 10px;
}

.tool-manager__group-list {
  display: grid;
  gap: 10px;
}

.tool-manager__tool-list {
  display: grid;
  gap: 8px;
}

.tool-manager-group-move,
.tool-manager-tool-move {
  transition: transform 320ms cubic-bezier(0.2, 0.85, 0.25, 1.08);
}

.tool-manager__group {
  border-radius: 14px;
  border: 1px solid rgb(148 163 184 / 26%);
  background: linear-gradient(160deg, rgb(255 255 255 / 82%), rgb(248 250 252 / 70%));
  box-shadow: 0 14px 28px rgb(15 23 42 / 6%);
  padding: 10px;
  display: grid;
  gap: 9px;
  position: relative;
  transition:
    transform 320ms cubic-bezier(0.2, 0.85, 0.25, 1.08),
    margin-top 260ms cubic-bezier(0.2, 0.85, 0.25, 1.08),
    border-color 180ms ease,
    box-shadow 200ms ease,
    opacity 180ms ease;
  will-change: transform, margin-top;
  transform-origin: center;
}

.tool-manager__group--dragging {
  opacity: 0.44;
  transform: scale(0.992);
}

.tool-manager__group--drop-anchor {
  margin-top: 14px;
}

.tool-manager__group--drop-anchor::before {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  top: -8px;
  border-top: 2px dashed rgb(37 99 235 / 74%);
  animation: tool-manager-drop-pulse 900ms ease-in-out infinite;
}

.tool-manager__group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
}

.tool-manager__group-head::-webkit-scrollbar {
  height: 0;
}

.tool-manager__group-name-input {
  flex: 0 0 180px;
  min-width: 180px;
}

.tool-manager__group-migrate-select {
  flex: 0 0 126px;
  min-width: 126px;
}

.tool-manager__delete-btn {
  border-radius: 8px;
  color: #334155;
}

.tool-manager__group-meta {
  font-size: 11px;
}

.tool-manager__tools {
  display: grid;
  gap: 8px;
}

.tool-manager__tool-row {
  border-radius: 10px;
  border: 1px solid rgb(226 232 240 / 82%);
  background: rgb(255 255 255 / 62%);
  padding: 8px;
  display: grid;
  grid-template-columns: minmax(140px, 0.34fr) minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  position: relative;
  transition:
    transform 320ms cubic-bezier(0.2, 0.85, 0.25, 1.08),
    margin-top 260ms cubic-bezier(0.2, 0.85, 0.25, 1.08),
    border-color 180ms ease,
    box-shadow 200ms ease,
    opacity 180ms ease;
  will-change: transform, margin-top;
  transform-origin: center;
}

.tool-manager__tool-row--dragging {
  opacity: 0.42;
  transform: scale(0.992);
}

.tool-manager__tool-row--drop-anchor {
  margin-top: 12px;
  border-color: rgb(125 169 255 / 70%);
  box-shadow: 0 8px 18px rgb(37 99 235 / 12%);
}

.tool-manager__tool-row--drop-anchor::before {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  top: -7px;
  border-top: 2px dashed rgb(37 99 235 / 78%);
  animation: tool-manager-drop-pulse 900ms ease-in-out infinite;
}

.tool-manager__tool-main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.tool-manager__tool-icon {
  width: 22px;
  height: 22px;
  border-radius: 7px;
  border: 1px solid rgb(148 163 184 / 35%);
  background: rgb(241 245 249 / 84%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
  flex-shrink: 0;
}

.tool-manager__tool-meta {
  min-width: 0;
  display: grid;
  gap: 1px;
}

.tool-manager__tool-id {
  font-size: 10px;
  letter-spacing: 0.05em;
}

.tool-manager__tool-controls {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
}

.tool-manager__toggle-pill {
  border-radius: 8px;
  border: 1px solid rgb(203 213 225 / 66%);
  background: rgb(248 250 252 / 76%);
  padding: 3px 7px;
  display: inline-flex;
  align-items: center;
}

.tool-manager__toggle-pill :deep(.n-checkbox) {
  font-size: 11px;
}

.tool-manager__inline-field {
  min-width: 0;
  flex: 1 1 0;
}

.tool-manager__inline-field--icon {
  flex: 0 0 110px;
}

.tool-manager__control-divider {
  width: 1px;
  height: 20px;
  background: rgb(148 163 184 / 35%);
  flex-shrink: 0;
}

.tool-manager__drop-zone {
  border-radius: 9px;
  border: 1px dashed rgb(148 163 184 / 72%);
  background: rgb(255 255 255 / 40%);
  padding: 7px;
  text-align: center;
  transition: border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
}

.tool-manager__drop-zone--active {
  border-color: rgb(37 99 235 / 70%);
  background: rgb(219 234 254 / 46%);
  box-shadow: inset 0 0 0 1px rgb(37 99 235 / 26%);
}

.tool-manager__drop-hint {
  font-size: 11px;
}

.tool-manager__group-end-zone {
  border-radius: 10px;
  border: 1px dashed rgb(148 163 184 / 58%);
  background: rgb(255 255 255 / 30%);
  padding: 8px;
  text-align: center;
  transition: border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
}

.tool-manager__group-end-zone--active {
  border-color: rgb(37 99 235 / 72%);
  background: rgb(219 234 254 / 44%);
  box-shadow: inset 0 0 0 1px rgb(37 99 235 / 28%);
}

.tool-manager__footer {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1160px) {
  .tool-manager__workspace {
    grid-template-columns: 1fr;
  }

  .tool-manager__rail {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: none;
  }
}

@media (max-width: 920px) {
  .tool-manager__hero {
    grid-template-columns: 1fr;
  }

  .tool-manager__stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .tool-manager__tool-row {
    grid-template-columns: 1fr;
  }

  .tool-manager__tool-controls {
    flex-wrap: wrap;
  }

  .tool-manager__control-divider {
    display: none;
  }

  .tool-manager__inline-field,
  .tool-manager__inline-field--icon {
    flex: 1 1 calc(50% - 6px);
    min-width: 140px;
  }
}

@keyframes tool-manager-drop-pulse {
  0% {
    opacity: 0.46;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0.46;
  }
}

@media (max-width: 640px) {
  .tool-manager__rail {
    grid-template-columns: 1fr;
  }

  .tool-manager__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
