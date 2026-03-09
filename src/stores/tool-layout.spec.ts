import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useToolLayoutStore } from '@/stores/tool-layout'
import { toolRegistry } from '@/tools/registry'

describe('tool layout store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    delete (window as unknown as { utools?: unknown }).utools
  })

  it('initializes grouped tools with all registered tool ids', () => {
    const store = useToolLayoutStore()
    store.initialize(toolRegistry)

    const groupedIds = store.effectiveConfig.groups.flatMap((group) => group.toolIds)
    expect(new Set(groupedIds).size).toBe(toolRegistry.length)
    expect(groupedIds.length).toBe(toolRegistry.length)
  })

  it('hides tools from visible groups and favorites', () => {
    const store = useToolLayoutStore()
    store.initialize(toolRegistry)

    store.setToolFavorite('json', true)
    store.setToolHidden('json', true)

    const visibleIds = store.groupedTools.flatMap((group) => group.tools.map((tool) => tool.id))
    expect(visibleIds.includes('json')).toBe(false)
    expect(store.favoriteTools.find((tool) => tool.id === 'json')).toBeUndefined()
  })

  it('moves tool across groups', () => {
    const store = useToolLayoutStore()
    store.initialize(toolRegistry)

    const sourceGroup = store.effectiveConfig.groups.find((group) => group.toolIds.includes('timestamp'))
    const targetGroup = store.effectiveConfig.groups.find((group) => group.id === 'data')

    expect(sourceGroup).toBeTruthy()
    expect(targetGroup).toBeTruthy()

    store.moveTool('timestamp', 'data', 1)

    const afterSource = store.effectiveConfig.groups.find((group) => group.id === sourceGroup?.id)
    const afterTarget = store.effectiveConfig.groups.find((group) => group.id === targetGroup?.id)

    expect(afterSource?.toolIds.includes('timestamp')).toBe(false)
    expect(afterTarget?.toolIds.includes('timestamp')).toBe(true)
  })

  it('loads from utools-backed storage on initialize', () => {
    ;(window as unknown as { utools: unknown }).utools = {
      dbStorage: {
        getItem: vi.fn().mockReturnValue({
          version: 1,
          groups: [
            { id: 'data', name: '数据解析', order: 1, toolIds: ['url', 'json'] },
            { id: 'text', name: '文本处理', order: 2, toolIds: ['regex'] }
          ],
          favorites: ['url'],
          hiddenTools: [],
          aliases: { json: '结构化 JSON' },
          icons: {}
        }),
        setItem: vi.fn()
      }
    }

    const store = useToolLayoutStore()
    store.initialize(toolRegistry)

    expect(store.effectiveConfig.aliases.json).toBe('结构化 JSON')
    expect(store.effectiveConfig.favorites[0]).toBe('url')
  })
})
