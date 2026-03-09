import { describe, expect, it } from 'vitest'
import { createJsonCodeValidator } from './json'

describe('json code validator', () => {
  it('returns no diagnostics for valid json', async () => {
    const validator = createJsonCodeValidator()
    const diagnostics = await validator({
      value: '{"a":1}',
      language: 'json'
    })

    expect(diagnostics).toEqual([])
  })

  it('returns error diagnostic for invalid json', async () => {
    const validator = createJsonCodeValidator()
    const diagnostics = await validator({
      value: '{"a":}',
      language: 'json'
    })

    expect(diagnostics.length).toBeGreaterThan(0)
    expect(diagnostics[0].severity).toBe('error')
  })
})
