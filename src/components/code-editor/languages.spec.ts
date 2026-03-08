import { describe, expect, it } from 'vitest'
import { codeLanguageOptions, resolveLanguageExtension } from '@/components/code-editor/languages'

describe('code editor language registry', () => {
  it('contains expected first-class languages', () => {
    expect(codeLanguageOptions.map((item) => item.value)).toEqual([
      'json',
      'javascript',
      'typescript',
      'html',
      'css',
      'markdown'
    ])
  })

  it('resolves every language to an extension', () => {
    for (const option of codeLanguageOptions) {
      const extension = resolveLanguageExtension(option.value)
      expect(extension).toBeTruthy()
    }
  })
})
