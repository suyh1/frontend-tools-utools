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

export type CodeEditorDiagnosticSeverity = 'error' | 'warning' | 'info'

export interface CodeEditorDiagnostic {
  from: number
  to: number
  message: string
  severity?: CodeEditorDiagnosticSeverity
  source?: string
}

export interface CodeEditorValidationContext {
  value: string
  language: string
}

export type CodeEditorValidator =
  | ((context: CodeEditorValidationContext) => CodeEditorDiagnostic[])
  | ((context: CodeEditorValidationContext) => Promise<CodeEditorDiagnostic[]>)

export interface CodeEditorValidationReport {
  diagnostics: CodeEditorDiagnostic[]
  hasError: boolean
  hasWarning: boolean
  valid: boolean
}
