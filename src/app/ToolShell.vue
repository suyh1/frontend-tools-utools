<script setup lang="ts">
import { computed, onMounted } from 'vue'
import {
  NConfigProvider,
  NEmpty,
  NFlex,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NTabPane,
  NTabs,
  NTag,
  NText
} from 'naive-ui'
import { resolveInitialToolId } from '@/app/enter-action'
import { useAppStore } from '@/stores/app'
import { toolRegistry, toolRegistryMap } from '@/tools/registry'

const appStore = useAppStore()

const sortedTools = computed(() => [...toolRegistry].sort((a, b) => a.order - b.order))

const activeToolId = computed({
  get: () => appStore.activeToolId,
  set: (toolId: string) => appStore.setActiveTool(toolId)
})

const activeTool = computed(() => toolRegistryMap.get(activeToolId.value) ?? null)

const recentToolNames = computed(() =>
  appStore.recentTools
    .map((toolId) => toolRegistryMap.get(toolId)?.name)
    .filter((name): name is string => Boolean(name))
    .slice(0, 3)
)

function handleToolChange(toolId: string) {
  appStore.setActiveTool(toolId)
}

function onPluginEnter(action: { code: string; type: string; payload: unknown; option: unknown }) {
  const fallbackToolId = appStore.recentTools[0] ?? 'json'
  const nextToolId = resolveInitialToolId(action, toolRegistry, fallbackToolId)
  appStore.setActiveTool(nextToolId)
}

onMounted(() => {
  if (window.utools?.onPluginEnter) {
    window.utools.onPluginEnter(onPluginEnter)
  }
})
</script>

<template>
  <n-config-provider>
    <n-layout class="tool-shell">
      <n-layout-header bordered class="tool-shell__header">
        <n-flex justify="space-between" align="center">
          <n-flex align="center" :size="8">
            <n-text strong>Frontend Tools</n-text>
            <n-tag size="small" type="info">uTools</n-tag>
          </n-flex>
          <n-flex align="center" :size="6">
            <n-text depth="3" class="tool-shell__recent-label">最近使用</n-text>
            <n-tag v-for="name in recentToolNames" :key="name" size="small" round>
              {{ name }}
            </n-tag>
          </n-flex>
        </n-flex>
      </n-layout-header>

      <n-layout-content class="tool-shell__content">
        <n-tabs v-model:value="activeToolId" type="line" animated @update:value="handleToolChange">
          <n-tab-pane v-for="tool in sortedTools" :key="tool.id" :name="tool.id" :tab="tool.name" />
        </n-tabs>

        <div class="tool-shell__panel">
          <component :is="activeTool.component" v-if="activeTool" />
          <n-empty v-else description="未找到对应工具" />
        </div>
      </n-layout-content>
    </n-layout>
  </n-config-provider>
</template>

<style scoped>
.tool-shell {
  min-height: 100vh;
  background: radial-gradient(circle at top right, #e7f2ff, #f5f8ff 45%, #f6f8fb 75%);
}

.tool-shell__header {
  padding: 12px 16px;
  background-color: rgb(255 255 255 / 86%);
  backdrop-filter: blur(3px);
}

.tool-shell__content {
  padding: 12px 16px 16px;
}

.tool-shell__panel {
  margin-top: 8px;
}

.tool-shell__recent-label {
  font-size: 12px;
}

@media (max-width: 720px) {
  .tool-shell__header {
    padding: 10px 12px;
  }

  .tool-shell__content {
    padding: 10px 12px 14px;
  }
}
</style>
