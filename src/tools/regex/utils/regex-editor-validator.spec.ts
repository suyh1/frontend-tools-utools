import { describe, expect, it } from 'vitest'
import { createRegexInputCodeValidator } from '@/tools/regex/utils/regex-editor-validator'

async function runValidator(pattern: string, flags: string, input: string) {
  const validator = createRegexInputCodeValidator({
    pattern,
    flags
  })

  return await validator({
    value: input,
    language: 'markdown'
  })
}

describe('regex editor validator', () => {
  it('returns diagnostic when pattern is invalid', async () => {
    const diagnostics = await runValidator('(', 'g', 'foo1 foo2')
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0].message).toContain('正则表达式无效')
  })

  it('returns empty diagnostics when pattern and flags are valid', async () => {
    const diagnostics = await runValidator('foo(\\d+)', 'g', 'foo1 foo2')
    expect(diagnostics).toEqual([])
  })
})
