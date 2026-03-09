import { describe, expect, it } from 'vitest'
import { toolRegistry } from '@/tools/registry'
import toolShellSource from './ToolShell.vue?raw'

describe('tool registry', () => {
  it('contains all route-a tools', () => {
    expect(toolRegistry.map((tool) => tool.id)).toEqual(['json', 'color', 'timestamp', 'codec', 'regex', 'url', 'jwt'])
  })

  it('uses async components for tool-level code splitting', () => {
    for (const tool of toolRegistry) {
      expect((tool.component as Record<string, unknown>).__asyncLoader).toBeTypeOf('function')
    }
  })

  it('defines compact shell controls for favorites, search and manager drawer', () => {
    expect(toolShellSource).toContain('favorites-strip')
    expect(toolShellSource).toContain('open-manager-button')
    expect(toolShellSource).toContain('MoreToolsPopover')
    expect(toolShellSource).toContain('ToolManagerDrawer')
  })
})
