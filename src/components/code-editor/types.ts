export const codeLanguages = ['json', 'javascript', 'typescript', 'html', 'css', 'markdown'] as const

export type CodeLanguage = (typeof codeLanguages)[number]

export interface CodeLanguageOption {
  label: string
  value: CodeLanguage
}

export interface CodeSelectionChange {
  from: number
  to: number
  text: string
}
