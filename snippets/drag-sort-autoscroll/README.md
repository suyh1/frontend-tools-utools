# 拖拽排序 + 边缘自动滚动代码片段使用手册

这个目录提供两套可直接复用的拖拽方案：

- 分组版：支持“分组拖拽 + 组内/跨组条目拖拽 + 末尾落点 + 边缘自动滚动”
- 单列表版：支持“单列表条目拖拽 + 末尾落点 + 边缘自动滚动”

适用于小窗应用、工具列表、快捷动作排序、看板列内排序等场景。

## 目录结构

- `useDragSortAutoScroll.ts`：分组版 composable（逻辑核心）
- `MinimalDragSortDemo.vue`：分组版最小示例
- `useSingleDragSortAutoScroll.ts`：单列表版 composable（逻辑核心）
- `MinimalSingleDragSortDemo.vue`：单列表版最小示例

## 选择哪一套

- 你的数据是“组 -> 条目”结构：用分组版
- 你的数据就是一个扁平数组：用单列表版
- 不确定时：先用单列表版，后续再切分组版

## 共同特性

两套方案都内置：

- 拖拽过程预览重排（不是 drop 后才突变）
- 插入落点判断（上半区/下半区）
- 末尾 drop-zone 落点
- `requestAnimationFrame` 节流
- 边缘自动滚动（靠近容器上下边缘自动滚）
- 拖拽结束后自动清理状态

## 快速开始（分组版）

### 1. 准备数据结构

`useDragSortAutoScroll.ts` 要求分组数据满足：

```ts
interface DragSortGroup {
  id: string
  itemIds: string[]
}
```

你可以扩展更多字段（如 `name`）：

```ts
interface ToolGroup {
  id: string
  name: string
  itemIds: string[]
}
```

### 2. 初始化 composable

```ts
import { ref } from 'vue'
import { useDragSortAutoScroll } from './useDragSortAutoScroll'

const groups = ref<ToolGroup[]>([
  { id: 'formatter', name: '格式化', itemIds: ['json', 'yaml', 'xml'] },
  { id: 'encoder', name: '编码', itemIds: ['base64', 'url', 'jwt'] }
])

const drag = useDragSortAutoScroll(groups, {
  edgePx: 56,
  maxStepPx: 20
})
```

参数说明：

- `edgePx`：距离上下边缘多少像素开始自动滚动（默认 `56`）
- `maxStepPx`：每帧最大滚动步长（默认 `20`）

### 3. 绑定事件（必须项）

分组层事件：

- `onGroupDragStart(groupIndex)`
- `onGroupDragOver(groupIndex, event)`
- `onGroupEndZoneDragOver(event)`
- `onGroupDrop()`
- `onGroupDragEnd()`

条目层事件：

- `onItemDragStart(itemId, sourceGroupId)`
- `onItemDragOver(groupId, itemIndex, event)`
- `onItemEndZoneDragOver(groupId, event)`
- `onItemDrop(groupId, itemIndex)`
- `onItemDragEnd()`

### 4. 绑定状态类（建议）

为了让交互可感知，建议绑定这些状态：

- `drag.dragGroupId === group.id`：当前拖拽分组
- `drag.isGroupDropAnchor(groupIndex)`：分组落点虚线
- `drag.isGroupDropAtEnd()`：分组末尾落点激活
- `drag.isDraggingItem(itemId)`：当前拖拽条目
- `drag.isItemDropAnchor(group.id, itemIndex)`：条目落点虚线
- `drag.isItemDropAtEnd(group.id)`：条目末尾落点激活

### 5. 最小应用示例（可直接改造）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useDragSortAutoScroll, type DragSortGroup } from './useDragSortAutoScroll'

interface Group extends DragSortGroup {
  name: string
}

const groups = ref<Group[]>([
  { id: 'formatter', name: '格式化', itemIds: ['json', 'yaml', 'xml'] },
  { id: 'encoder', name: '编码', itemIds: ['base64', 'url', 'jwt'] }
])

const drag = useDragSortAutoScroll(groups)
</script>

<template>
  <transition-group name="group" tag="div">
    <article
      v-for="(group, groupIndex) in drag.renderedGroups"
      :key="group.id"
      draggable="true"
      @dragstart="drag.onGroupDragStart(groupIndex)"
      @dragover.prevent="(event) => drag.onGroupDragOver(groupIndex, event)"
      @drop="drag.onGroupDrop"
      @dragend="drag.onGroupDragEnd"
    >
      <h4>{{ group.name }}</h4>

      <transition-group name="item" tag="ul">
        <li
          v-for="(itemId, itemIndex) in group.itemIds"
          :key="itemId"
          draggable="true"
          @dragstart="drag.onItemDragStart(itemId, group.id)"
          @dragover.prevent="(event) => drag.onItemDragOver(group.id, itemIndex, event)"
          @drop="drag.onItemDrop(group.id, itemIndex)"
          @dragend="drag.onItemDragEnd"
        >
          {{ itemId }}
        </li>
      </transition-group>

      <div
        @dragover.prevent="(event) => drag.onItemEndZoneDragOver(group.id, event)"
        @drop="drag.onItemDrop(group.id, group.itemIds.length)"
      >
        拖到这里放到分组末尾
      </div>
    </article>
  </transition-group>

  <div
    @dragover.prevent="(event) => drag.onGroupEndZoneDragOver(event)"
    @drop="drag.onGroupDrop"
  >
    拖到这里放到分组末尾
  </div>
</template>
```

> 完整可运行样式示例见 `MinimalDragSortDemo.vue`

## 快速开始（单列表版）

### 1. 准备数据结构

```ts
interface Item {
  id: string
  name: string
}
```

### 2. 初始化 composable

```ts
import { ref } from 'vue'
import { useSingleDragSortAutoScroll } from './useSingleDragSortAutoScroll'

const items = ref<Item[]>([
  { id: 'json', name: 'JSON' },
  { id: 'yaml', name: 'YAML' },
  { id: 'xml', name: 'XML' }
])

const drag = useSingleDragSortAutoScroll(items, {
  getId: (item) => item.id,
  edgePx: 56,
  maxStepPx: 20
})
```

### 3. 绑定事件（必须项）

- `onItemDragStart(index)`
- `onItemDragOver(index, event)`
- `onEndZoneDragOver(event)`
- `onDrop()`
- `onDragEnd()`

### 4. 绑定状态类（建议）

- `drag.isDraggingItem(item.id)`：当前拖拽项
- `drag.isDropAnchor(index)`：插入位置虚线
- `drag.isDropAtEnd()`：末尾落点激活

### 5. 最小应用示例（可直接改造）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useSingleDragSortAutoScroll } from './useSingleDragSortAutoScroll'

const items = ref([
  { id: 'json', name: 'JSON' },
  { id: 'yaml', name: 'YAML' },
  { id: 'xml', name: 'XML' }
])

const drag = useSingleDragSortAutoScroll(items, {
  getId: (item) => item.id
})
</script>

<template>
  <transition-group name="item" tag="ul">
    <li
      v-for="(item, index) in drag.renderedItems"
      :key="item.id"
      draggable="true"
      @dragstart="drag.onItemDragStart(index)"
      @dragover.prevent="(event) => drag.onItemDragOver(index, event)"
      @drop="drag.onDrop"
      @dragend="drag.onDragEnd"
    >
      {{ item.name }}
    </li>
  </transition-group>

  <div @dragover.prevent="(event) => drag.onEndZoneDragOver(event)" @drop="drag.onDrop">
    拖到这里放到列表末尾
  </div>
</template>
```

> 完整可运行样式示例见 `MinimalSingleDragSortDemo.vue`

## 与后端同步的建议

默认行为：drop 后 composable 会直接把新顺序写回源 `ref`。你可以在外层 `watch` 数据后提交后端：

```ts
watch(groups, (value) => {
  // POST /save-layout
}, { deep: true })
```

建议做防抖，避免频繁请求。

## 常见问题

### 1) 为什么拖拽时没有自动滚动？

请确认：

- 列表容器确实可滚动（`overflow-y: auto` 或 `scroll`）
- 容器高度不是自适应撑满（需要有可滚动空间）
- 鼠标拖拽时确实靠近容器上/下边缘（默认 `56px`）

### 2) 为什么没有位移动画？

请确认使用了 `transition-group`，并设置了 `*-move` 样式，例如：

```css
.item-move {
  transition: transform 320ms cubic-bezier(0.2, 0.85, 0.25, 1.08);
}
```

### 3) 如何调手感？

- 更灵敏：增大 `maxStepPx`（如 `24`）
- 更稳：减小 `maxStepPx`（如 `14`）
- 更早触发：增大 `edgePx`（如 `72`）

## 快速复用清单

1. 复制对应 composable 到你的 `src/composables/`
2. 复制对应 demo 组件作为起始模板
3. 替换字段映射（`itemIds` / `getId`）
4. 保留事件绑定（不要漏 `drop` 和 `dragend`）
5. 加上三类状态样式：`--dragging` / `--drop-anchor` / `--active`
6. 如需持久化，外层加 `watch + 防抖` 同步后端
