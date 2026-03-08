import { describe, expect, it } from 'vitest'
import { resolveInitialToolId, resolveToolIdFromEnterAction } from '@/app/enter-action'
import { toolRegistry } from '@/tools/registry'

describe('enter action mapping', () => {
  it('maps plugin enter action to active tool id when keyword matches', () => {
    const toolId = resolveToolIdFromEnterAction(
      {
        code: 'main',
        type: 'text',
        payload: 'json 格式化',
        option: null
      },
      toolRegistry
    )

    expect(toolId).toBe('json')
  })

  it('falls back to recent tool when no match exists', () => {
    const nextToolId = resolveInitialToolId(
      {
        code: 'main',
        type: 'text',
        payload: 'unknown keyword',
        option: null
      },
      toolRegistry,
      'color'
    )

    expect(nextToolId).toBe('color')
  })
})
