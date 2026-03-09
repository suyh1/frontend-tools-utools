import type { CodeEditorDiagnostic, CodeEditorValidator } from '@/components/code-editor/types'

interface JsonValidatorOptions {
  source?: string
  ignoreEmpty?: boolean
}

interface JsonErrorDetail {
  message: string
  position: number
  line: number
  column: number
}

function toJsonErrorDetail(input: string, error: unknown): JsonErrorDetail {
  const fallbackMessage = error instanceof Error ? error.message : 'JSON 解析失败'
  const message = fallbackMessage || 'JSON 解析失败'

  const positionMatch = /position\s+(\d+)/i.exec(message)
  const lineMatch = /line\s+(\d+)/i.exec(message)
  const columnMatch = /column\s+(\d+)/i.exec(message)

  let position = positionMatch ? Number(positionMatch[1]) : null
  let line = lineMatch ? Number(lineMatch[1]) : null
  let column = columnMatch ? Number(columnMatch[1]) : null

  if ((line === null || column === null) && position !== null) {
    const prefix = input.slice(0, position)
    const lineCount = prefix.split('\n').length
    const lastLineBreak = prefix.lastIndexOf('\n')
    const columnCount = position - lastLineBreak

    line = lineCount
    column = columnCount
  }

  if (position === null && line !== null && column !== null) {
    const lines = input.split('\n')
    const previousLength = lines.slice(0, Math.max(line - 1, 0)).reduce((total, current) => total + current.length + 1, 0)
    position = previousLength + Math.max(column - 1, 0)
  }

  if (position === null) {
    position = Math.max(input.length - 1, 0)
  }

  if (line === null || column === null) {
    const prefix = input.slice(0, position)
    const lineCount = prefix.split('\n').length
    const lastLineBreak = prefix.lastIndexOf('\n')
    const columnCount = position - lastLineBreak
    line = lineCount
    column = columnCount
  }

  return {
    message,
    line,
    column,
    position
  }
}

function toDiagnostic(detail: JsonErrorDetail, input: string, source: string): CodeEditorDiagnostic {
  const from = Math.max(0, Math.min(detail.position, input.length))
  let to = from

  if (from < input.length) {
    to = from + 1
  }

  return {
    from,
    to,
    source,
    severity: 'error',
    message: `JSON 校验失败：${detail.message} (Line ${detail.line}, Col ${detail.column})`
  }
}

export function createJsonCodeValidator(options: JsonValidatorOptions = {}): CodeEditorValidator {
  const source = options.source ?? 'json'
  const ignoreEmpty = options.ignoreEmpty ?? true

  return ({ value, language }) => {
    if (language !== 'json') {
      return []
    }

    if (ignoreEmpty && value.trim().length === 0) {
      return []
    }

    try {
      JSON.parse(value)
      return []
    } catch (error) {
      return [toDiagnostic(toJsonErrorDetail(value, error), value, source)]
    }
  }
}
