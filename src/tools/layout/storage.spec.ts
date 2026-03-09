import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  TOOL_LAYOUT_STORAGE_KEY,
  clearToolLayoutConfig,
  loadToolLayoutConfig,
  saveToolLayoutConfig
} from '@/tools/layout/storage'
import type { ToolLayoutConfigV1 } from '@/tools/layout/types'

function createConfig(): ToolLayoutConfigV1 {
  return {
    version: 1,
    groups: [
      {
        id: 'data',
        name: '数据解析',
        order: 1,
        toolIds: ['json']
      }
    ],
    favorites: ['json'],
    hiddenTools: [],
    aliases: {},
    icons: {}
  }
}

describe('tool layout storage', () => {
  beforeEach(() => {
    clearToolLayoutConfig()
    localStorage.clear()
    delete (window as unknown as { utools?: unknown }).utools
  })

  it('loads from utools first', () => {
    const config = createConfig()
    ;(window as unknown as { utools: unknown }).utools = {
      dbStorage: {
        getItem: vi.fn().mockReturnValue(config)
      }
    }

    const loaded = loadToolLayoutConfig()

    expect(loaded).toEqual(config)
  })

  it('falls back to localStorage when utools value is unavailable', () => {
    const config = createConfig()
    ;(window as unknown as { utools: unknown }).utools = {
      dbStorage: {
        getItem: vi.fn().mockReturnValue(null)
      }
    }
    localStorage.setItem(TOOL_LAYOUT_STORAGE_KEY, JSON.stringify(config))

    const loaded = loadToolLayoutConfig()

    expect(loaded).toEqual(config)
  })

  it('writes to localStorage even when utools write throws', () => {
    const config = createConfig()
    ;(window as unknown as { utools: unknown }).utools = {
      dbStorage: {
        setItem: vi.fn(() => {
          throw new Error('utools unavailable')
        })
      }
    }

    saveToolLayoutConfig(config)

    const local = localStorage.getItem(TOOL_LAYOUT_STORAGE_KEY)
    expect(local).toBeTruthy()
    expect(JSON.parse(local ?? 'null')).toEqual(config)
  })
})
