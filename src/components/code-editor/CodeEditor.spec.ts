import { describe, expect, it } from 'vitest'
import codeEditorSource from './CodeEditor.vue?raw'

describe('CodeEditor style variables', () => {
  it('declares static defaults for custom height properties', () => {
    expect(codeEditorSource).toContain('--code-editor-min-height: 240px;')
    expect(codeEditorSource).toContain('--code-editor-max-height: none;')
  })
})
