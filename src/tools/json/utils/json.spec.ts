import { describe, expect, it } from 'vitest'
import { formatJson, minifyJson, validateJson } from './json'

describe('json utilities', () => {
  it('formats valid json with 2 spaces', () => {
    const result = formatJson('{"a":1,"b":{"c":2}}', 2)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output).toContain('\n  "a": 1,')
      expect(result.output).toContain('\n    "c": 2')
    }
  })

  it('minifies valid json', () => {
    const result = minifyJson('{\n  "a": 1,\n  "b": [1, 2, 3]\n}')

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output).toBe('{"a":1,"b":[1,2,3]}')
    }
  })

  it('returns position info for invalid json', () => {
    const result = validateJson('{"a":}')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message.length).toBeGreaterThan(0)
      expect(result.error.position).not.toBeNull()
      expect(result.error.line).not.toBeNull()
      expect(result.error.column).not.toBeNull()
    }
  })
})
