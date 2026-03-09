import { describe, expect, it } from 'vitest'
import codeEditorSource from './CodeEditor.vue?raw'

describe('CodeEditor style variables', () => {
  it('declares static defaults for custom height properties', () => {
    expect(codeEditorSource).toContain('--code-editor-min-height: 240px;')
    expect(codeEditorSource).toContain('--code-editor-max-height: none;')
  })

  it('wires tooltip filter for lint diagnostics', () => {
    expect(codeEditorSource).toContain('tooltipFilter: () => []')
    expect(codeEditorSource).toContain('createDiagnosticHoverTooltipExtension()')
    expect(codeEditorSource).toContain("tooltips({ position: 'absolute' })")
  })

  it('defines lint tooltip styles for popover display', () => {
    expect(codeEditorSource).toContain('cm-tooltip-lint-compact')
    expect(codeEditorSource).toContain('cm-code-tooltip-item')
  })
})
