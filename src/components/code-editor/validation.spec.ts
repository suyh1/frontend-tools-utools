import { describe, expect, it } from 'vitest'
import type { CodeEditorValidator } from '@/components/code-editor/types'
import { runCodeEditorValidators } from '@/components/code-editor/validation'

describe('code-editor validation pipeline', () => {
  it('aggregates diagnostics from sync and async validators', async () => {
    const validators: CodeEditorValidator[] = [
      () => [{ from: 0, to: 1, message: 'sync', severity: 'warning' }],
      async () => [{ from: 2, to: 3, message: 'async', severity: 'error' }]
    ]

    const result = await runCodeEditorValidators({
      validators,
      value: 'abcd',
      language: 'json'
    })

    expect(result.diagnostics).toHaveLength(2)
    expect(result.hasWarning).toBe(true)
    expect(result.hasError).toBe(true)
    expect(result.valid).toBe(false)
  })

  it('clamps invalid ranges into document bounds', async () => {
    const validators: CodeEditorValidator[] = [
      () => [{ from: -10, to: 999, message: 'range' }]
    ]

    const result = await runCodeEditorValidators({
      validators,
      value: 'abc',
      language: 'json'
    })

    expect(result.diagnostics[0]).toMatchObject({ from: 0, to: 3 })
  })

  it('converts validator exceptions to diagnostics', async () => {
    const validators: CodeEditorValidator[] = [
      () => {
        throw new Error('boom')
      }
    ]

    const result = await runCodeEditorValidators({
      validators,
      value: 'abc',
      language: 'json'
    })

    expect(result.valid).toBe(false)
    expect(result.diagnostics[0].message).toContain('boom')
  })
})
