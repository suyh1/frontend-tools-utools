import { describe, expect, it } from 'vitest'
import { toolRegistry } from '@/tools/registry'

describe('tool registry', () => {
  it('contains json and color tools', () => {
    expect(toolRegistry.map((tool) => tool.id)).toEqual(['json', 'color'])
  })
})
