import { describe, expect, it } from 'vitest'
import { buildDefaultToolLayout } from '@/tools/layout/default-layout'
import { toolRegistry } from '@/tools/registry'

describe('default tool layout', () => {
  it('contains all tools exactly once in grouped order', () => {
    const layout = buildDefaultToolLayout(toolRegistry)
    const toolIds = layout.groups.flatMap((group) => group.toolIds)
    expect(new Set(toolIds).size).toBe(toolRegistry.length)
    expect(toolIds.length).toBe(toolRegistry.length)
  })

  it('sorts groups by group order and tool order', () => {
    const layout = buildDefaultToolLayout(toolRegistry)
    expect(layout.groups.map((group) => group.id)).toEqual(['data', 'text', 'utility'])
    expect(layout.groups[0].toolIds).toEqual(['json', 'url', 'jwt'])
    expect(layout.groups[1].toolIds).toEqual(['codec', 'regex'])
    expect(layout.groups[2].toolIds).toEqual(['color', 'timestamp'])
  })

  it('uses default favorite tools from registry', () => {
    const layout = buildDefaultToolLayout(toolRegistry)
    expect(layout.favorites).toEqual(['json', 'codec', 'regex', 'url'])
  })
})
