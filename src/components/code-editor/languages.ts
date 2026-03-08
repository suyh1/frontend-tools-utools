import type { Extension } from '@codemirror/state'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import type { CodeLanguage, CodeLanguageOption } from '@/components/code-editor/types'

export const codeLanguageOptions: CodeLanguageOption[] = [
  { label: 'JSON', value: 'json' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'Markdown', value: 'markdown' }
]

export function resolveLanguageExtension(language: CodeLanguage): Extension {
  switch (language) {
    case 'json':
      return json()
    case 'javascript':
      return javascript({ typescript: false })
    case 'typescript':
      return javascript({ typescript: true })
    case 'html':
      return html()
    case 'css':
      return css()
    case 'markdown':
      return markdown()
    default:
      return json()
  }
}
