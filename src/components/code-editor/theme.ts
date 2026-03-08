import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import type { Extension } from '@codemirror/state'

const editorHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#2a57d9', fontWeight: '600' },
  { tag: [tags.atom, tags.bool], color: '#0ea5b8', fontWeight: '600' },
  { tag: [tags.string, tags.special(tags.string)], color: '#0e7490' },
  { tag: [tags.number, tags.integer, tags.float], color: '#c2410c' },
  { tag: [tags.comment], color: '#64748b', fontStyle: 'italic' },
  { tag: [tags.variableName], color: '#1e293b' },
  { tag: [tags.definition(tags.variableName)], color: '#0f172a', fontWeight: '600' },
  { tag: [tags.typeName, tags.className], color: '#4f46e5' },
  { tag: [tags.propertyName], color: '#0369a1' },
  { tag: [tags.operator, tags.punctuation], color: '#334155' }
])

const glassEditorTheme = EditorView.theme({
  '&': {
    color: '#0f172a',
    backgroundColor: 'rgb(255 255 255 / 74%)',
    borderRadius: '12px',
    border: '1px solid rgb(255 255 255 / 82%)'
  },
  '.cm-scroller': {
    fontFamily: 'JetBrains Mono, SF Mono, Menlo, Consolas, monospace',
    lineHeight: '1.55'
  },
  '.cm-content': {
    minHeight: 'var(--code-editor-min-height)',
    maxHeight: 'var(--code-editor-max-height)',
    caretColor: '#0f172a',
    padding: '12px 0'
  },
  '.cm-line': {
    padding: '0 12px'
  },
  '.cm-gutters': {
    backgroundColor: 'rgb(255 255 255 / 48%)',
    color: '#64748b',
    border: 'none'
  },
  '.cm-activeLine': {
    backgroundColor: 'rgb(36 123 255 / 7%)'
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgb(36 123 255 / 12%)',
    color: '#1d4ed8'
  },
  '&.cm-editor.cm-focused': {
    outline: 'none',
    boxShadow: '0 0 0 3px rgb(36 123 255 / 16%)'
  },
  '.cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'rgb(36 123 255 / 26%) !important'
  },
  '.cm-foldPlaceholder': {
    backgroundColor: 'rgb(255 255 255 / 86%)',
    borderColor: 'rgb(148 163 184 / 36%)',
    color: '#334155'
  }
})

export const codeEditorThemeExtension: Extension[] = [glassEditorTheme, syntaxHighlighting(editorHighlightStyle)]
