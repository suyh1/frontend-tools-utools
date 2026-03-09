import { describe, expect, it } from 'vitest'
import { analyzeRegex, previewRegexReplace } from './regex'

describe('regex utils', () => {
  it('analyzes global matches and capture groups', () => {
    const result = analyzeRegex('(foo)(\\d+)', 'g', 'foo1 foo22')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.matches).toHaveLength(2)
    expect(result.matches[0].value).toBe('foo1')
    expect(result.matches[0].groups).toEqual(['foo', '1'])
  })

  it('analyzes a single match without global flag', () => {
    const result = analyzeRegex('bar(\\d+)', '', 'foo bar2 bar3')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.matches).toHaveLength(1)
    expect(result.matches[0].value).toBe('bar2')
  })

  it('previews regex replace output', () => {
    const result = previewRegexReplace('foo(\\d+)', 'g', 'foo1 foo2', 'bar$1')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.output).toBe('bar1 bar2')
  })

  it('returns error for invalid regex pattern', () => {
    const result = analyzeRegex('[', 'g', 'abc')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('正则表达式无效')
    }
  })
})
