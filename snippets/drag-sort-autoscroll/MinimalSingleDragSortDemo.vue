<script setup lang="ts">
import { ref } from 'vue'
import { useSingleDragSortAutoScroll } from './useSingleDragSortAutoScroll'

interface DemoItem {
  id: string
  name: string
}

const items = ref<DemoItem[]>([
  { id: 'json', name: 'JSON' },
  { id: 'yaml', name: 'YAML' },
  { id: 'xml', name: 'XML' },
  { id: 'base64', name: 'Base64' },
  { id: 'url', name: 'URL' },
  { id: 'jwt', name: 'JWT' },
  { id: 'regex', name: 'Regex' },
  { id: 'timestamp', name: 'Timestamp' }
])

const { renderedItems, isDraggingItem, isDropAnchor, isDropAtEnd, onItemDragStart, onItemDragOver, onEndZoneDragOver, onDrop, onDragEnd } =
  useSingleDragSortAutoScroll(items, {
  getId: (item) => item.id
  })
</script>

<template>
  <section class="demo">
    <h3>单列表拖拽排序最小示例</h3>

    <transition-group name="item" tag="ul" class="item-list">
      <li
        v-for="(item, index) in renderedItems"
        :key="item.id"
        class="item-row"
        :class="{
          'item-row--dragging': isDraggingItem(item.id),
          'item-row--drop-anchor': isDropAnchor(index)
        }"
        draggable="true"
        @dragstart="onItemDragStart(index)"
        @dragover.prevent="(event) => onItemDragOver(index, event)"
        @drop="onDrop"
        @dragend="onDragEnd"
      >
        {{ item.name }}
      </li>
    </transition-group>

    <div
      class="drop-zone"
      :class="{ 'drop-zone--active': isDropAtEnd() }"
      @dragover.prevent="(event) => onEndZoneDragOver(event)"
      @drop="onDrop"
    >
      拖到这里放到列表末尾
    </div>
  </section>
</template>

<style scoped>
.demo {
  display: grid;
  gap: 12px;
}

.item-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.item-row {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 10px;
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

.drop-zone {
  border-radius: 8px;
  border: 1px dashed #94a3b8;
  padding: 8px;
  font-size: 12px;
  color: #475569;
  text-align: center;
}

.drop-zone--active {
  border-color: #3b82f6;
  background: rgb(219 234 254 / 45%);
}

.item-move {
  transition: transform 320ms cubic-bezier(0.2, 0.85, 0.25, 1.08);
}
</style>
