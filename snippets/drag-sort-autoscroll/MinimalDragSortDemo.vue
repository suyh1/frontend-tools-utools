<script setup lang="ts">
import { ref } from 'vue'
import { useDragSortAutoScroll, type DragSortGroup } from './useDragSortAutoScroll'

interface DemoGroup extends DragSortGroup {
  name: string
}

const groups = ref<DemoGroup[]>([
  {
    id: 'formatter',
    name: '格式化',
    itemIds: ['json', 'yaml', 'xml']
  },
  {
    id: 'encoder',
    name: '编码',
    itemIds: ['base64', 'url', 'jwt']
  },
  {
    id: 'assist',
    name: '辅助',
    itemIds: ['regex', 'timestamp', 'color']
  }
])

const labels: Record<string, string> = {
  json: 'JSON',
  yaml: 'YAML',
  xml: 'XML',
  base64: 'Base64',
  url: 'URL',
  jwt: 'JWT',
  regex: 'Regex',
  timestamp: 'Timestamp',
  color: 'Color'
}

const {
  renderedGroups,
  dragGroupId,
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
  isDraggingItem,
  isGroupDropAnchor,
  isGroupDropAtEnd,
  isItemDropAnchor,
  isItemDropAtEnd
} = useDragSortAutoScroll(groups)

function resolveLabel(id: string): string {
  return labels[id] ?? id
}
</script>

<template>
  <section class="demo">
    <h3>拖拽排序最小示例</h3>

    <transition-group name="group" tag="div" class="group-list">
      <article
        v-for="(group, groupIndex) in renderedGroups"
        :key="group.id"
        class="group-card"
        :class="{
          'group-card--dragging': dragGroupId === group.id,
          'group-card--drop-anchor': isGroupDropAnchor(groupIndex)
        }"
        draggable="true"
        @dragstart="onGroupDragStart(groupIndex)"
        @dragover.prevent="(event) => onGroupDragOver(groupIndex, event)"
        @drop="onGroupDrop"
        @dragend="onGroupDragEnd"
      >
        <header class="group-head">
          <strong>{{ group.name }}</strong>
          <span>{{ group.itemIds.length }} 项</span>
        </header>

        <transition-group name="item" tag="ul" class="item-list">
          <li
            v-for="(itemId, itemIndex) in group.itemIds"
            :key="itemId"
            class="item-row"
            :class="{
              'item-row--dragging': isDraggingItem(itemId),
              'item-row--drop-anchor': isItemDropAnchor(group.id, itemIndex)
            }"
            draggable="true"
            @dragstart="onItemDragStart(itemId, group.id)"
            @dragover.prevent="(event) => onItemDragOver(group.id, itemIndex, event)"
            @drop="onItemDrop(group.id, itemIndex)"
            @dragend="onItemDragEnd"
          >
            {{ resolveLabel(itemId) }}
          </li>
        </transition-group>

        <div
          class="drop-zone"
          :class="{ 'drop-zone--active': isItemDropAtEnd(group.id) }"
          @dragover.prevent="(event) => onItemEndZoneDragOver(group.id, event)"
          @drop="onItemDrop(group.id, group.itemIds.length)"
        >
          拖到这里放到分组末尾
        </div>
      </article>
    </transition-group>

    <div
      class="group-end-zone"
      :class="{ 'group-end-zone--active': isGroupDropAtEnd() }"
      @dragover.prevent="(event) => onGroupEndZoneDragOver(event)"
      @drop="onGroupDrop"
    >
      拖到这里放到分组末尾
    </div>
  </section>
</template>

<style scoped>
.demo {
  display: grid;
  gap: 12px;
}

.group-list {
  display: grid;
  gap: 10px;
}

.group-card {
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #fff;
  padding: 10px;
  display: grid;
  gap: 8px;
  position: relative;
  transition:
    transform 320ms cubic-bezier(0.2, 0.85, 0.25, 1.08),
    margin-top 260ms cubic-bezier(0.2, 0.85, 0.25, 1.08),
    opacity 180ms ease,
    box-shadow 180ms ease;
}

.group-card--dragging {
  opacity: 0.45;
  transform: scale(0.992);
}

.group-card--drop-anchor {
  margin-top: 14px;
}

.group-card--drop-anchor::before {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  top: -8px;
  border-top: 2px dashed #3b82f6;
}

.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.item-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}

.item-row {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 7px 9px;
  background: #f8fafc;
  font-size: 13px;
  position: relative;
  transition:
    transform 320ms cubic-bezier(0.2, 0.85, 0.25, 1.08),
    margin-top 260ms cubic-bezier(0.2, 0.85, 0.25, 1.08),
    opacity 180ms ease,
    box-shadow 180ms ease;
}

.item-row--dragging {
  opacity: 0.45;
  transform: scale(0.992);
}

.item-row--drop-anchor {
  margin-top: 10px;
  box-shadow: 0 8px 18px rgb(59 130 246 / 16%);
}

.item-row--drop-anchor::before {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  top: -7px;
  border-top: 2px dashed #3b82f6;
}

.drop-zone,
.group-end-zone {
  border-radius: 8px;
  border: 1px dashed #94a3b8;
  padding: 8px;
  font-size: 12px;
  color: #475569;
  text-align: center;
}

.drop-zone--active,
.group-end-zone--active {
  border-color: #3b82f6;
  background: rgb(219 234 254 / 45%);
}

.group-move,
.item-move {
  transition: transform 320ms cubic-bezier(0.2, 0.85, 0.25, 1.08);
}
</style>
