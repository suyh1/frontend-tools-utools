import { describe, expect, it } from 'vitest'
import { toolRegistry } from '@/tools/registry'

describe('tool registry', () => {
  it('contains json and color tools', () => {
    expect(toolRegistry.map((tool) => tool.id)).toEqual(['json', 'color'])
  })

  it('uses async components for tool-level code splitting', () => {
    for (const tool of toolRegistry) {
      expect((tool.component as Record<string, unknown>).__asyncLoader).toBeTypeOf('function')
    }
  })
})
