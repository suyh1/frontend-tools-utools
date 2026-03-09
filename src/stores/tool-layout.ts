import { defineStore } from 'pinia'
import { buildDefaultToolLayout } from '@/tools/layout/default-layout'
import { saveToolLayoutConfig, loadToolLayoutConfig } from '@/tools/layout/storage'
import type { ToolLayoutConfigV1, ToolLayoutGroup, ToolDisplayInfo } from '@/tools/layout/types'
import { toolRegistry } from '@/tools/registry'
import type { ToolDefinition } from '@/tools/types'

const FALLBACK_GROUP_ID = 'ungrouped'
const FALLBACK_GROUP_NAME = '未分组'

interface GroupedToolView {
  id: string
  name: string
  tools: ToolDisplayInfo[]
}

function sanitizeToolIds(ids: string[], validIds: Set<string>, seen: Set<string>): string[] {
  const next: string[] = []
  for (const id of ids) {
    if (!validIds.has(id) || seen.has(id)) {
      continue
    }
    seen.add(id)
    next.push(id)
  }
  return next
}

function sanitizeMap(input: Record<string, string> | undefined, validIds: Set<string>): Record<string, string> {
  const result: Record<string, string> = {}
  if (!input) {
    return result
  }

  for (const [key, value] of Object.entries(input)) {
    if (!validIds.has(key) || typeof value !== 'string') {
      continue
    }

    const trimmed = value.trim()
    if (!trimmed) {
      continue
    }
    result[key] = trimmed
  }

  return result
}

function createFallbackGroup(order: number): ToolLayoutGroup {
  return {
    id: FALLBACK_GROUP_ID,
    name: FALLBACK_GROUP_NAME,
    order,
    toolIds: []
  }
}

function cloneGroups(groups: ToolLayoutGroup[]): ToolLayoutGroup[] {
  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    order: group.order,
    toolIds: [...group.toolIds]
  }))
}

function resolveDefaultGroupByTool(defaultLayout: ToolLayoutConfigV1): Map<string, string> {
  const map = new Map<string, string>()
  for (const group of defaultLayout.groups) {
    for (const toolId of group.toolIds) {
      map.set(toolId, group.id)
    }
  }
  return map
}

function mergeLayoutConfig(tools: ToolDefinition[], customConfig: ToolLayoutConfigV1 | null): ToolLayoutConfigV1 {
  const defaultLayout = buildDefaultToolLayout(tools)
  if (!customConfig) {
    return defaultLayout
  }

  const validToolIds = new Set(tools.map((tool) => tool.id))
  const defaultGroupByToolId = resolveDefaultGroupByTool(defaultLayout)
  const seenToolIds = new Set<string>()

  const providedGroups = Array.isArray(customConfig.groups) ? customConfig.groups : []
  const dedupedGroups: ToolLayoutGroup[] = []
  const seenGroupIds = new Set<string>()

  for (const group of providedGroups) {
    if (!group || typeof group.id !== 'string' || seenGroupIds.has(group.id)) {
      continue
    }

    seenGroupIds.add(group.id)
    dedupedGroups.push({
      id: group.id,
      name: typeof group.name === 'string' && group.name.trim() ? group.name.trim() : group.id,
      order: Number.isFinite(group.order) ? group.order : dedupedGroups.length + 1,
      toolIds: sanitizeToolIds(Array.isArray(group.toolIds) ? group.toolIds : [], validToolIds, seenToolIds)
    })
  }

  if (!dedupedGroups.length) {
    dedupedGroups.push(...cloneGroups(defaultLayout.groups))
    for (const group of dedupedGroups) {
      for (const toolId of group.toolIds) {
        seenToolIds.add(toolId)
      }
    }
  }

  for (const defaultGroup of defaultLayout.groups) {
    if (seenGroupIds.has(defaultGroup.id)) {
      continue
    }
    dedupedGroups.push({
      id: defaultGroup.id,
      name: defaultGroup.name,
      order: dedupedGroups.length + 1,
      toolIds: []
    })
    seenGroupIds.add(defaultGroup.id)
  }

  const missingToolIds = [...validToolIds].filter((toolId) => !seenToolIds.has(toolId))

  for (const toolId of missingToolIds) {
    const defaultGroupId = defaultGroupByToolId.get(toolId)
    const targetGroup =
      dedupedGroups.find((group) => group.id === defaultGroupId) ??
      dedupedGroups.find((group) => group.id === FALLBACK_GROUP_ID) ??
      null

    if (targetGroup) {
      targetGroup.toolIds.push(toolId)
      continue
    }

    const fallbackGroup = createFallbackGroup(dedupedGroups.length + 1)
    fallbackGroup.toolIds.push(toolId)
    dedupedGroups.push(fallbackGroup)
  }

  const hiddenTools = sanitizeToolIds(
    Array.isArray(customConfig.hiddenTools) ? customConfig.hiddenTools : [],
    validToolIds,
    new Set<string>()
  )
  const favorites = sanitizeToolIds(
    Array.isArray(customConfig.favorites) ? customConfig.favorites : [],
    validToolIds,
    new Set<string>()
  )

  return {
    version: 1,
    groups: dedupedGroups.map((group, index) => ({
      ...group,
      order: index + 1
    })),
    favorites,
    hiddenTools,
    aliases: sanitizeMap(customConfig.aliases, validToolIds),
    icons: sanitizeMap(customConfig.icons, validToolIds)
  }
}

function findGroup(groups: ToolLayoutGroup[], groupId: string): ToolLayoutGroup | undefined {
  return groups.find((group) => group.id === groupId)
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) {
    return [...items]
  }

  const next = [...items]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}

export const useToolLayoutStore = defineStore('tool-layout', {
  state: () => ({
    config: null as ToolLayoutConfigV1 | null,
    initialized: false,
    searchQuery: '',
    managerVisible: false
  }),
  getters: {
    effectiveConfig: (state): ToolLayoutConfigV1 => {
      return state.config ?? buildDefaultToolLayout(toolRegistry)
    },
    toolMap: () => new Map(toolRegistry.map((tool) => [tool.id, tool])),
    visibleToolIdSet(state): Set<string> {
      const hidden = new Set(this.effectiveConfig.hiddenTools)
      return new Set(toolRegistry.map((tool) => tool.id).filter((id) => !hidden.has(id)))
    },
    groupedTools(state): GroupedToolView[] {
      const search = state.searchQuery.trim().toLowerCase()
      const visibleIds = this.visibleToolIdSet
      const aliases = this.effectiveConfig.aliases
      const icons = this.effectiveConfig.icons

      const groups: GroupedToolView[] = []

      for (const group of this.effectiveConfig.groups) {
        const tools: ToolDisplayInfo[] = []

        for (const toolId of group.toolIds) {
          if (!visibleIds.has(toolId)) {
            continue
          }

          const definition = this.toolMap.get(toolId)
          if (!definition) {
            continue
          }

          const name = aliases[toolId] ?? definition.name
          const icon = icons[toolId] ?? definition.icon
          const keywordText = definition.keywords.join(' ').toLowerCase()
          const hit =
            !search || name.toLowerCase().includes(search) || definition.name.toLowerCase().includes(search) || keywordText.includes(search)

          if (!hit) {
            continue
          }

          tools.push({
            id: definition.id,
            name,
            icon,
            keywords: definition.keywords
          })
        }

        if (tools.length) {
          groups.push({
            id: group.id,
            name: group.name,
            tools
          })
        }
      }

      return groups
    },
    favoriteTools(): ToolDisplayInfo[] {
      const visibleIds = this.visibleToolIdSet
      const aliases = this.effectiveConfig.aliases
      const icons = this.effectiveConfig.icons
      const items: ToolDisplayInfo[] = []

      for (const toolId of this.effectiveConfig.favorites) {
        if (!visibleIds.has(toolId)) {
          continue
        }

        const definition = this.toolMap.get(toolId)
        if (!definition) {
          continue
        }

        items.push({
          id: definition.id,
          name: aliases[toolId] ?? definition.name,
          icon: icons[toolId] ?? definition.icon,
          keywords: definition.keywords
        })
      }

      if (items.length) {
        return items
      }

      // Keep at least one quick-switch tool in strip.
      const firstVisible = toolRegistry.find((tool) => visibleIds.has(tool.id))
      if (!firstVisible) {
        return []
      }

      return [
        {
          id: firstVisible.id,
          name: aliases[firstVisible.id] ?? firstVisible.name,
          icon: icons[firstVisible.id] ?? firstVisible.icon,
          keywords: firstVisible.keywords
        }
      ]
    }
  },
  actions: {
    initialize(tools: ToolDefinition[] = toolRegistry) {
      const loaded = loadToolLayoutConfig()
      this.config = mergeLayoutConfig(tools, loaded)
      this.initialized = true
    },
    persistConfig() {
      if (!this.config) {
        return
      }
      saveToolLayoutConfig(this.config)
    },
    setSearchQuery(query: string) {
      this.searchQuery = query
    },
    setManagerVisible(visible: boolean) {
      this.managerVisible = visible
    },
    setToolFavorite(toolId: string, favorite: boolean) {
      const current = this.effectiveConfig
      const favorites = current.favorites.filter((id) => id !== toolId)
      if (favorite) {
        favorites.push(toolId)
      }
      this.config = {
        ...current,
        favorites
      }
      this.persistConfig()
    },
    setToolHidden(toolId: string, hidden: boolean) {
      const current = this.effectiveConfig
      const hiddenTools = current.hiddenTools.filter((id) => id !== toolId)
      if (hidden) {
        hiddenTools.push(toolId)
      }
      this.config = {
        ...current,
        hiddenTools
      }
      this.persistConfig()
    },
    setToolAlias(toolId: string, alias: string) {
      const current = this.effectiveConfig
      const aliases = { ...current.aliases }
      const trimmed = alias.trim()
      if (!trimmed) {
        delete aliases[toolId]
      } else {
        aliases[toolId] = trimmed
      }
      this.config = {
        ...current,
        aliases
      }
      this.persistConfig()
    },
    setToolIcon(toolId: string, icon: string) {
      const current = this.effectiveConfig
      const icons = { ...current.icons }
      const trimmed = icon.trim()
      if (!trimmed) {
        delete icons[toolId]
      } else {
        icons[toolId] = trimmed
      }
      this.config = {
        ...current,
        icons
      }
      this.persistConfig()
    },
    addGroup(name: string) {
      const current = this.effectiveConfig
      const trimmed = name.trim()
      if (!trimmed) {
        return
      }

      const groupId = `custom-${Date.now().toString(36)}`
      this.config = {
        ...current,
        groups: [
          ...current.groups,
          {
            id: groupId,
            name: trimmed,
            order: current.groups.length + 1,
            toolIds: []
          }
        ]
      }
      this.persistConfig()
    },
    renameGroup(groupId: string, name: string) {
      const current = this.effectiveConfig
      const trimmed = name.trim()
      if (!trimmed) {
        return
      }

      this.config = {
        ...current,
        groups: current.groups.map((group) =>
          group.id === groupId
            ? {
                ...group,
                name: trimmed
              }
            : group
        )
      }
      this.persistConfig()
    },
    removeGroup(groupId: string, targetGroupId: string) {
      const current = this.effectiveConfig
      if (groupId === targetGroupId) {
        return
      }

      const sourceGroup = findGroup(current.groups, groupId)
      const targetGroup = findGroup(current.groups, targetGroupId)
      if (!sourceGroup || !targetGroup) {
        return
      }

      const nextGroups = current.groups
        .filter((group) => group.id !== groupId)
        .map((group) => {
          if (group.id !== targetGroupId) {
            return group
          }

          return {
            ...group,
            toolIds: [...group.toolIds, ...sourceGroup.toolIds]
          }
        })
        .map((group, index) => ({
          ...group,
          order: index + 1
        }))

      this.config = {
        ...current,
        groups: nextGroups
      }
      this.persistConfig()
    },
    reorderGroups(sourceIndex: number, targetIndex: number) {
      const current = this.effectiveConfig
      const reordered = moveItem(current.groups, sourceIndex, targetIndex).map((group, index) => ({
        ...group,
        order: index + 1
      }))

      this.config = {
        ...current,
        groups: reordered
      }
      this.persistConfig()
    },
    moveTool(toolId: string, targetGroupId: string, targetIndex: number) {
      const current = this.effectiveConfig
      const nextGroups = current.groups.map((group) => ({
        ...group,
        toolIds: group.toolIds.filter((id) => id !== toolId)
      }))
      const targetGroup = findGroup(nextGroups, targetGroupId)
      if (!targetGroup) {
        return
      }

      const insertIndex = Math.max(0, Math.min(targetIndex, targetGroup.toolIds.length))
      targetGroup.toolIds.splice(insertIndex, 0, toolId)

      this.config = {
        ...current,
        groups: nextGroups
      }
      this.persistConfig()
    },
    resetToDefault(tools: ToolDefinition[] = toolRegistry) {
      this.config = buildDefaultToolLayout(tools)
      this.persistConfig()
    },
    applyImportedConfig(config: ToolLayoutConfigV1, tools: ToolDefinition[] = toolRegistry) {
      this.config = mergeLayoutConfig(tools, config)
      this.persistConfig()
    }
  }
})

export type { GroupedToolView }
