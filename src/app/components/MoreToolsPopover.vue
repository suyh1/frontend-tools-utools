<script setup lang="ts">
import { NButton, NEmpty, NPopover, NText } from 'naive-ui'
import type { GroupedToolView } from '@/stores/tool-layout'

defineProps<{
  groups: GroupedToolView[]
  activeToolId: string
}>()

const emit = defineEmits<{
  (event: 'select', toolId: string): void
}>()

function handleSelect(toolId: string) {
  emit('select', toolId)
}
</script>

<template>
  <n-popover trigger="click" placement="bottom-end" :show-arrow="false">
    <template #trigger>
      <slot name="trigger">
        <n-button size="small" strong secondary data-testid="more-tools-trigger">更多工具</n-button>
      </slot>
    </template>

    <div class="more-tools" data-testid="more-tools-content">
      <n-empty v-if="!groups.length" description="没有匹配到工具" size="small" />
      <template v-else>
        <section v-for="group in groups" :key="group.id" class="more-tools__group">
          <n-text depth="3" class="more-tools__group-name">{{ group.name }}</n-text>

          <div class="more-tools__group-tools">
            <n-button
              v-for="tool in group.tools"
              :key="tool.id"
              size="small"
              :type="tool.id === activeToolId ? 'primary' : 'default'"
              secondary
              @click="handleSelect(tool.id)"
              :data-testid="`more-tool-${tool.id}`"
            >
              <span class="more-tools__icon">{{ tool.icon }}</span>
              <span>{{ tool.name }}</span>
            </n-button>
          </div>
        </section>
      </template>
    </div>
  </n-popover>
</template>

<style scoped>
.more-tools {
  width: min(420px, calc(100vw - 40px));
  max-height: min(440px, calc(100vh - 120px));
  overflow: auto;
  padding: 8px;
  display: grid;
  gap: 10px;
}

.more-tools__group {
  display: grid;
  gap: 6px;
}

.more-tools__group-name {
  font-size: 11px;
}

.more-tools__group-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.more-tools__icon {
  display: inline-flex;
  width: 16px;
  justify-content: center;
  margin-right: 4px;
}
</style>
