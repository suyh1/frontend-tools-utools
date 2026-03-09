import type { Diagnostic } from '@codemirror/lint'
import type {
  CodeEditorDiagnostic,
  CodeEditorDiagnosticSeverity,
  CodeEditorValidationReport,
  CodeEditorValidator
} from '@/components/code-editor/types'

interface RunCodeEditorValidatorsOptions {
  validators: CodeEditorValidator[]
  value: string
  language: string
}

const severityRankMap: Record<'error' | 'warning' | 'info' | 'hint', number> = {
  error: 0,
  warning: 1,
  info: 2,
  hint: 3
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function normalizeSeverity(severity: CodeEditorDiagnosticSeverity | undefined): CodeEditorDiagnosticSeverity {
  if (severity === 'warning' || severity === 'info') {
    return severity
  }

  return 'error'
}

function severityRank(severity: CodeEditorDiagnosticSeverity | 'hint' | undefined): number {
  if (severity === 'warning' || severity === 'info' || severity === 'hint') {
    return severityRankMap[severity]
  }

  return severityRankMap.error
}

function compareDiagnostics(a: CodeEditorDiagnostic, b: CodeEditorDiagnostic): number {
  const severityDiff = severityRank(normalizeSeverity(a.severity)) - severityRank(normalizeSeverity(b.severity))
  if (severityDiff !== 0) {
    return severityDiff
  }

  if (a.from !== b.from) {
    return a.from - b.from
  }

  if (a.to !== b.to) {
    return a.to - b.to
  }

  return a.message.localeCompare(b.message)
}

function normalizeDiagnostic(diagnostic: CodeEditorDiagnostic, docLength: number): CodeEditorDiagnostic {
  const rawFrom = Number.isFinite(diagnostic.from) ? Math.trunc(diagnostic.from) : 0
  const rawTo = Number.isFinite(diagnostic.to) ? Math.trunc(diagnostic.to) : rawFrom + 1

  let from = clamp(rawFrom, 0, docLength)
  let to = clamp(rawTo, 0, docLength)

  if (to < from) {
    const swappedFrom = to
    to = from
    from = swappedFrom
  }

  if (to === from && from < docLength) {
    to = from + 1
  }

  return {
    from,
    to,
    message: diagnostic.message,
    source: diagnostic.source,
    severity: normalizeSeverity(diagnostic.severity)
  }
}

function toFailureDiagnostic(message: string): CodeEditorDiagnostic {
  return {
    from: 0,
    to: 0,
    message,
    severity: 'error',
    source: 'validator'
  }
}

export function toCodeMirrorDiagnostics(diagnostics: CodeEditorDiagnostic[]): Diagnostic[] {
  return diagnostics.map((item) => ({
    from: item.from,
    to: item.to,
    message: item.message,
    severity: normalizeSeverity(item.severity),
    source: item.source
  }))
}

export function filterTooltipDiagnostics(diagnostics: readonly Diagnostic[]): Diagnostic[] {
  return [...diagnostics].sort((a, b) => {
    const severityDiff = severityRank(a.severity) - severityRank(b.severity)
    if (severityDiff !== 0) {
      return severityDiff
    }

    if (a.from !== b.from) {
      return a.from - b.from
    }

    if (a.to !== b.to) {
      return a.to - b.to
    }

    return a.message.localeCompare(b.message)
  })
}

export async function runCodeEditorValidators(
  options: RunCodeEditorValidatorsOptions
): Promise<CodeEditorValidationReport> {
  const diagnostics: CodeEditorDiagnostic[] = []
  const docLength = options.value.length

  for (const validator of options.validators) {
    try {
      const nextDiagnostics = await validator({
        value: options.value,
        language: options.language
      })

      if (!Array.isArray(nextDiagnostics)) {
        continue
      }

      for (const diagnostic of nextDiagnostics) {
        if (!diagnostic || typeof diagnostic.message !== 'string') {
          continue
        }

        diagnostics.push(normalizeDiagnostic(diagnostic, docLength))
      }
    } catch (error) {
      diagnostics.push(
        toFailureDiagnostic(error instanceof Error ? `校验器执行失败：${error.message}` : '校验器执行失败')
      )
    }
  }

  diagnostics.sort(compareDiagnostics)

  const hasError = diagnostics.some((item) => normalizeSeverity(item.severity) === 'error')
  const hasWarning = diagnostics.some((item) => normalizeSeverity(item.severity) === 'warning')

  return {
    diagnostics,
    hasError,
    hasWarning,
    valid: !hasError
  }
}
