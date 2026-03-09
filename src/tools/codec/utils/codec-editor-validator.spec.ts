import { describe, expect, it } from 'vitest'
import { createCodecInputCodeValidator } from '@/tools/codec/utils/codec-editor-validator'

async function runValidator(mode: 'url-decode' | 'base64-decode' | 'url-encode', input: string) {
  const validator = createCodecInputCodeValidator({ mode })
  return await validator({
    value: input,
    language: 'markdown'
  })
}

describe('codec editor validator', () => {
  it('returns diagnostic when decode input is invalid', async () => {
    const diagnostics = await runValidator('url-decode', '%')
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0].message).toContain('URL Decode')
  })

  it('returns empty diagnostics for non-decode modes', async () => {
    const diagnostics = await runValidator('url-encode', '%')
    expect(diagnostics).toEqual([])
  })
})
