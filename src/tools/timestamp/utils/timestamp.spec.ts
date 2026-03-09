import { describe, expect, it } from 'vitest'
import { formatTimestampView, parseDateInput, toRelativeLabel } from './timestamp'

describe('timestamp utils', () => {
  it('parses seconds timestamp input', () => {
    const result = parseDateInput('1704067200')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.timestampMs).toBe(1704067200000)
    expect(result.sourceUnit).toBe('seconds')
  })

  it('parses milliseconds timestamp input', () => {
    const result = parseDateInput('1704067200000')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.timestampMs).toBe(1704067200000)
    expect(result.sourceUnit).toBe('milliseconds')
  })

  it('parses datetime string input', () => {
    const result = parseDateInput('2024-01-01T00:00:00Z')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.timestampMs).toBe(1704067200000)
    expect(result.sourceUnit).toBe('datetime')
  })

  it('formats timestamp view with utc and relative labels', () => {
    const view = formatTimestampView(1704067200000, 1704067200000)
    expect(view.timestampSec).toBe(1704067200)
    expect(view.isoUtc).toBe('2024-01-01T00:00:00.000Z')
    expect(view.relativeText).toBe('刚刚')
  })

  it('returns relative labels for past and future', () => {
    const now = 1_700_000_000_000
    expect(toRelativeLabel(now - 3 * 60 * 1000, now)).toBe('3 分钟前')
    expect(toRelativeLabel(now + 2 * 60 * 60 * 1000, now)).toBe('2 小时后')
  })

  it('returns error for invalid input', () => {
    const result = parseDateInput('not-a-date')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('无法解析')
    }
  })
})
