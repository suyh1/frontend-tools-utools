import type { ToolDefinition } from '@/tools/types'
import type { ToolLayoutConfigV1, ToolLayoutGroup } from '@/tools/layout/types'

const LAYOUT_VERSION = 1 as const

function uniqueById(items: ToolDefinition[]): ToolDefinition[] {
  const map = new Map<string, ToolDefinition>()
  for (const item of items) {
    map.set(item.id, item)
  }
  return [...map.values()]
}

export function buildDefaultToolLayout(tools: ToolDefinition[]): ToolLayoutConfigV1 {
  const grouped = new Map<string, ToolLayoutGroup>()

  for (const tool of uniqueById(tools)) {
    if (!grouped.has(tool.groupId)) {
      grouped.set(tool.groupId, {
        id: tool.groupId,
        name: tool.groupName,
        order: tool.groupOrder,
        toolIds: []
      })
    }

    const current = grouped.get(tool.groupId)
    if (current) {
      current.toolIds.push(tool.id)
    }
  }

  const groups = [...grouped.values()]
    .map((group) => {
      const groupTools = tools
        .filter((tool) => tool.groupId === group.id)
        .sort((a, b) => a.order - b.order)
        .map((tool) => tool.id)
      return {
        ...group,
        toolIds: groupTools
      }
    })
    .sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order
      }
      return a.name.localeCompare(b.name)
    })

  const favorites = tools
    .filter((tool) => tool.defaultFavorite)
    .sort((a, b) => a.order - b.order)
    .map((tool) => tool.id)

  return {
    version: LAYOUT_VERSION,
    groups,
    favorites,
    hiddenTools: [],
    aliases: {},
    icons: {}
  }
}
