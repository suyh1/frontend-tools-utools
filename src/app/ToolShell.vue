<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { NButton, NConfigProvider, NEmpty, NInput, NPopover, NText } from 'naive-ui'
import MoreToolsPopover from '@/app/components/MoreToolsPopover.vue'
import ToolManagerDrawer from '@/app/components/ToolManagerDrawer.vue'
import { resolveInitialToolId } from '@/app/enter-action'
import { useAppStore } from '@/stores/app'
import { useToolLayoutStore } from '@/stores/tool-layout'
import { toolRegistry, toolRegistryMap } from '@/tools/registry'

const appStore = useAppStore()
const toolLayoutStore = useToolLayoutStore()

const activeToolId = computed(() => appStore.activeToolId)
const activeTool = computed(() => toolRegistryMap.get(activeToolId.value) ?? null)
const favoriteTools = computed(() => toolLayoutStore.favoriteTools)
const groupedTools = computed(() => toolLayoutStore.groupedTools)
const managerVisible = computed({
  get: () => toolLayoutStore.managerVisible,
  set: (value: boolean) => toolLayoutStore.setManagerVisible(value)
})
const searchQueryModel = computed({
  get: () => toolLayoutStore.searchQuery,
  set: (value: string) => toolLayoutStore.setSearchQuery(value)
})

const visibleToolIds = computed(() => [...toolLayoutStore.visibleToolIdSet])

function resolveActiveToolFallback(preferredId?: string): string | null {
  if (!visibleToolIds.value.length) {
    return null
  }

  if (preferredId && toolLayoutStore.visibleToolIdSet.has(preferredId)) {
    return preferredId
  }

  const firstFavorite = favoriteTools.value[0]?.id
  if (firstFavorite && toolLayoutStore.visibleToolIdSet.has(firstFavorite)) {
    return firstFavorite
  }

  return visibleToolIds.value[0] ?? null
}

function handleToolChange(toolId: string) {
  if (!toolLayoutStore.visibleToolIdSet.has(toolId)) {
    return
  }
  appStore.setActiveTool(toolId)
}

function onPluginEnter(action: { code: string; type: string; payload: unknown; option: unknown }) {
  const fallbackToolId = resolveActiveToolFallback(appStore.recentTools[0] ?? 'json')
  const nextToolId = resolveInitialToolId(action, toolRegistry, fallbackToolId ?? 'json')
  const safeToolId = resolveActiveToolFallback(nextToolId)
  if (safeToolId) {
    appStore.setActiveTool(safeToolId)
  }
}

watch(
  visibleToolIds,
  () => {
    const safeToolId = resolveActiveToolFallback(activeToolId.value)
    if (safeToolId && safeToolId !== activeToolId.value) {
      appStore.setActiveTool(safeToolId)
    }
  },
  { immediate: true }
)

onMounted(() => {
  toolLayoutStore.initialize(toolRegistry)

  const safeToolId = resolveActiveToolFallback(activeToolId.value)
  if (safeToolId && safeToolId !== activeToolId.value) {
    appStore.setActiveTool(safeToolId)
  }

  if (window.utools?.onPluginEnter) {
    window.utools.onPluginEnter(onPluginEnter)
  }
})
</script>

<template>
  <n-config-provider>
    <div class="tool-shell fade-up-enter-active">
      <div class="tool-shell__layout">
        <header class="tool-shell__toolbar" data-testid="tool-toolbar">
          <div class="tool-shell__brand-mark" aria-hidden="true">FT</div>

          <div class="tool-shell__favorites" data-testid="favorites-strip">
            <n-button
              v-for="tool in favoriteTools"
              :key="tool.id"
              size="tiny"
              tertiary
              round
              class="tool-shell__favorite-pill"
              :class="{ 'tool-shell__favorite-pill--active': tool.id === activeToolId }"
              @click="handleToolChange(tool.id)"
              :data-testid="`favorite-tool-${tool.id}`"
              :title="tool.name"
            >
              <span class="tool-shell__favorite-icon">{{ tool.icon }}</span>
              <span class="tool-shell__favorite-name">{{ tool.name }}</span>
            </n-button>
          </div>

          <div class="tool-shell__toolbar-actions">
            <n-popover trigger="click" placement="bottom-end" :show-arrow="false">
              <template #trigger>
                <n-button
                  size="tiny"
                  quaternary
                  circle
                  class="tool-shell__icon-button"
                  data-testid="open-search-button"
                  title="搜索工具"
                >
                  <span class="tool-shell__icon-glyph" aria-hidden="true">⌕</span>
                </n-button>
              </template>

              <div class="tool-shell__search-popover" data-testid="tool-search-popover">
                <n-text depth="3" class="tool-shell__search-label">搜索工具</n-text>
                <n-input
                  v-model:value="searchQueryModel"
                  size="small"
                  clearable
                  placeholder="名称或关键词"
                  data-testid="tool-search-input"
                />
              </div>
            </n-popover>

            <MoreToolsPopover :groups="groupedTools" :active-tool-id="activeToolId" @select="handleToolChange">
              <template #trigger>
                <n-button
                  size="tiny"
                  quaternary
                  circle
                  class="tool-shell__icon-button"
                  data-testid="open-more-tools-button"
                  title="更多工具"
                >
                  <span class="tool-shell__icon-glyph" aria-hidden="true">◫</span>
                </n-button>
              </template>
            </MoreToolsPopover>

            <n-button
              size="tiny"
              quaternary
              circle
              class="tool-shell__icon-button tool-shell__icon-button--primary"
              @click="managerVisible = true"
              data-testid="open-manager-button"
              title="管理工具"
            >
              <span class="tool-shell__icon-glyph" aria-hidden="true">⚙</span>
            </n-button>
          </div>
        </header>

        <transition name="panel-fade" mode="out-in">
          <div class="tool-shell__panel" :key="activeToolId">
            <component :is="activeTool.component" v-if="activeTool && toolLayoutStore.visibleToolIdSet.has(activeTool.id)" />
            <n-empty v-else description="没有可用工具，请在管理工具中调整可见性" />
          </div>
        </transition>
      </div>

      <ToolManagerDrawer v-model:show="managerVisible" />
    </div>
  </n-config-provider>
</template>

<style scoped>
.tool-shell {
  min-height: 100vh;
  padding: 6px;
}

.tool-shell__layout {
  min-height: calc(100vh - 12px);
  border-radius: 12px;
  border: 1px solid rgb(255 255 255 / 60%);
  background: rgb(255 255 255 / 44%);
  box-shadow: 0 12px 26px rgb(15 23 42 / 9%);
  backdrop-filter: blur(12px);
  padding: 6px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 6px;
}

.tool-shell__toolbar {
  border-radius: 10px;
  border: 1px solid rgb(255 255 255 / 72%);
  background: linear-gradient(130deg, rgb(255 255 255 / 84%), rgb(255 255 255 / 68%));
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 90%);
  padding: 6px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
}

.tool-shell__brand-mark {
  width: 28px;
  height: 28px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: #0f172a;
  border: 1px solid rgb(148 163 184 / 34%);
  background: linear-gradient(135deg, rgb(36 123 255 / 24%), rgb(0 216 210 / 22%));
}

.tool-shell__favorites {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  min-width: 0;
  padding: 1px;
}

.tool-shell__favorites::-webkit-scrollbar {
  height: 0;
}

.tool-shell__favorite-pill {
  border: 1px solid rgb(255 255 255 / 78%);
  background: rgb(255 255 255 / 58%);
  backdrop-filter: blur(8px);
  transition: border-color 180ms ease, background-color 180ms ease;
  flex-shrink: 0;
}

.tool-shell__favorite-pill :deep(.n-button__content) {
  display: inline-flex;
  align-items: center;
}

.tool-shell__favorite-icon {
  width: 16px;
  display: inline-flex;
  justify-content: center;
}

.tool-shell__favorite-name {
  max-width: 0;
  opacity: 0;
  margin-left: 0;
  overflow: hidden;
  white-space: nowrap;
  transition: max-width 180ms ease, opacity 180ms ease, margin-left 180ms ease;
}

.tool-shell__favorite-pill:hover .tool-shell__favorite-name,
.tool-shell__favorite-pill--active .tool-shell__favorite-name {
  max-width: 120px;
  opacity: 1;
  margin-left: 4px;
}

.tool-shell__favorite-pill--active {
  border-color: rgb(36 123 255 / 42%);
  background: linear-gradient(130deg, rgb(36 123 255 / 20%), rgb(0 216 210 / 18%));
}

.tool-shell__toolbar-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.tool-shell__icon-button {
  width: 28px;
  height: 28px;
  border-radius: 9px;
  border: 1px solid rgb(203 213 225 / 64%);
  background: rgb(255 255 255 / 70%);
}

.tool-shell__icon-button--primary {
  border-color: rgb(36 123 255 / 38%);
  background: linear-gradient(130deg, rgb(36 123 255 / 24%), rgb(0 216 210 / 24%));
}

.tool-shell__icon-glyph {
  font-size: 14px;
  line-height: 1;
}

.tool-shell__search-popover {
  width: min(300px, calc(100vw - 40px));
  display: grid;
  gap: 6px;
}

.tool-shell__search-label {
  font-size: 11px;
}

.tool-shell__panel {
  min-height: 0;
  overflow: auto;
  border-radius: 12px;
  padding: 1px;
}

.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

@media (max-width: 980px) {
  .tool-shell {
    padding: 4px;
  }

  .tool-shell__layout {
    min-height: calc(100vh - 8px);
    padding: 4px;
  }

  .tool-shell__toolbar {
    grid-template-columns: auto minmax(0, 1fr) auto;
    padding: 5px;
  }
}
</style>
