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
    <div class="tool-shell fade-up-enter-active">
      <div class="tool-shell__orb tool-shell__orb--left" />
      <div class="tool-shell__orb tool-shell__orb--right" />

      <n-layout class="tool-shell__layout" :native-scrollbar="false">
        <n-layout-header class="tool-shell__header">
          <div class="tool-shell__header-card">
            <n-flex justify="space-between" align="center" :wrap="false" class="tool-shell__header-row">
              <div class="tool-shell__brand">
                <n-text class="tool-shell__title" strong>Frontend Tools</n-text>
                <n-text depth="3" class="tool-shell__subtitle">Glass + Bold Accent Workspace</n-text>
              </div>

              <n-flex align="center" :size="6" class="tool-shell__recent">
                <n-text depth="3" class="tool-shell__recent-label">最近使用</n-text>
                <n-tag v-for="name in recentToolNames" :key="name" size="small" round class="tool-shell__recent-tag">
                  {{ name }}
                </n-tag>
              </n-flex>
            </n-flex>
          </div>
        </n-layout-header>

        <n-layout-content class="tool-shell__content">
          <div class="tool-shell__tabs-wrap">
            <n-tabs
              v-model:value="activeToolId"
              type="line"
              animated
              class="tool-shell__tabs"
              @update:value="handleToolChange"
            >
              <n-tab-pane v-for="tool in sortedTools" :key="tool.id" :name="tool.id">
                <template #tab>
                  <span class="tool-shell__tab-label">
                    <span class="tool-shell__tab-icon">{{ tool.icon }}</span>
                    <span>{{ tool.name }}</span>
                  </span>
                </template>
              </n-tab-pane>
            </n-tabs>
          </div>

          <transition name="panel-fade" mode="out-in">
            <div class="tool-shell__panel" :key="activeToolId">
              <component :is="activeTool.component" v-if="activeTool" />
              <n-empty v-else description="未找到对应工具" />
            </div>
          </transition>
        </n-layout-content>
      </n-layout>
    </div>
  </n-config-provider>
</template>

<style scoped>
.tool-shell {
  position: relative;
  min-height: 100vh;
  padding: 16px;
  overflow: hidden;
}

.tool-shell__layout {
  position: relative;
  min-height: calc(100vh - 32px);
  background: rgb(255 255 255 / 34%);
  border: 1px solid rgb(255 255 255 / 58%);
  border-radius: 24px;
  box-shadow: 0 28px 68px rgb(15 23 42 / 11%);
  backdrop-filter: blur(16px);
}

.tool-shell__orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(0);
  pointer-events: none;
  opacity: 0.65;
}

.tool-shell__orb--left {
  top: -96px;
  left: -110px;
  width: 290px;
  height: 290px;
  background: radial-gradient(circle at 32% 32%, rgb(36 123 255 / 36%), transparent 72%);
}

.tool-shell__orb--right {
  top: -78px;
  right: -84px;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle at 50% 50%, rgb(0 216 210 / 34%), transparent 72%);
}

.tool-shell__header {
  padding: 14px 14px 0;
  background: transparent;
}

.tool-shell__header-card {
  border-radius: 18px;
  padding: 14px 16px;
  background: rgb(255 255 255 / 66%);
  border: 1px solid rgb(255 255 255 / 72%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 78%);
}

.tool-shell__header-row {
  gap: 10px;
}

.tool-shell__brand {
  display: flex;
  flex-direction: column;
}

.tool-shell__title {
  font-size: 22px;
  line-height: 1.08;
  letter-spacing: 0.01em;
  color: #0f172a;
}

.tool-shell__subtitle {
  font-size: 12px;
  margin-top: 4px;
}

.tool-shell__recent {
  row-gap: 6px;
}

.tool-shell__recent-label {
  font-size: 12px;
}

.tool-shell__recent-tag {
  border: 1px solid rgb(255 255 255 / 80%);
  background: rgb(255 255 255 / 62%);
}

.tool-shell__content {
  padding: 10px 14px 14px;
}

.tool-shell__tabs-wrap {
  border-radius: 16px;
  border: 1px solid rgb(255 255 255 / 68%);
  background: rgb(255 255 255 / 56%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 82%);
  padding: 4px 10px 0;
}

.tool-shell__tab-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.tool-shell__tab-icon {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #fff;
  background: linear-gradient(135deg, #247bff, #00d8d2);
  box-shadow: 0 6px 12px rgb(36 123 255 / 22%);
}

.tool-shell__panel {
  margin-top: 12px;
  padding: 2px;
  border-radius: 20px;
}

.tool-shell__tabs :deep(.n-tabs-nav) {
  margin-bottom: 0;
}

.tool-shell__tabs :deep(.n-tabs-nav-scroll-content) {
  gap: 4px;
}

.tool-shell__tabs :deep(.n-tabs-tab) {
  margin-right: 0;
  border-radius: 12px;
  transition: all 220ms ease;
}

.tool-shell__tabs :deep(.n-tabs-tab.n-tabs-tab--active) {
  background: rgb(255 255 255 / 70%);
  box-shadow: 0 10px 20px rgb(36 123 255 / 14%);
}

.tool-shell__tabs :deep(.n-tabs-bar) {
  background: linear-gradient(120deg, #247bff, #00d8d2);
  height: 3px;
  border-radius: 999px;
}

.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (max-width: 880px) {
  .tool-shell {
    padding: 10px;
  }

  .tool-shell__layout {
    min-height: calc(100vh - 20px);
    border-radius: 18px;
  }

  .tool-shell__header {
    padding: 10px 10px 0;
  }

  .tool-shell__header-card {
    padding: 12px;
  }

  .tool-shell__title {
    font-size: 18px;
  }

  .tool-shell__subtitle {
    display: none;
  }

  .tool-shell__recent {
    display: none;
  }

  .tool-shell__content {
    padding: 10px;
  }
}
</style>
