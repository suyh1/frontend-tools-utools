import { describe, expect, it } from 'vitest'
import {
  parseImportedToolLayoutText,
  serializeToolLayoutConfig,
  validateImportedToolLayout
} from '@/tools/layout/import-export'

describe('tool layout import/export', () => {
  it('validates imported layout payload', () => {
    const result = validateImportedToolLayout({
      version: 1,
      groups: [{ id: 'data', name: '数据解析', order: 1, toolIds: ['json', 'url'] }],
      favorites: ['json'],
      hiddenTools: [],
      aliases: { json: '结构化 JSON' },
      icons: { json: 'JS' }
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.config.groups[0].id).toBe('data')
      expect(result.config.aliases.json).toBe('结构化 JSON')
    }
  })

  it('rejects invalid payload with clear message', () => {
    const result = validateImportedToolLayout({
      version: 2,
      groups: []
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('version=1')
    }
  })

  it('parses serialized text back to valid config', () => {
    const text = serializeToolLayoutConfig({
      version: 1,
      groups: [{ id: 'data', name: '数据解析', order: 1, toolIds: ['json'] }],
      favorites: ['json'],
      hiddenTools: [],
      aliases: {},
      icons: {}
    })

    const parsed = parseImportedToolLayoutText(text)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.config.favorites).toEqual(['json'])
    }
  })
})
