import type { JsonErrorDetail, JsonTransformResult, JsonValidateResult } from '@/tools/json/types'

function toErrorDetail(input: string, error: unknown): JsonErrorDetail {
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

export function formatJson(input: string, indent: number): JsonTransformResult {
  try {
    const parsed = JSON.parse(input)
    return {
      ok: true,
      output: JSON.stringify(parsed, null, indent)
    }
  } catch (error) {
    return {
      ok: false,
      error: toErrorDetail(input, error)
    }
  }
}

export function minifyJson(input: string): JsonTransformResult {
  try {
    const parsed = JSON.parse(input)
    return {
      ok: true,
      output: JSON.stringify(parsed)
    }
  } catch (error) {
    return {
      ok: false,
      error: toErrorDetail(input, error)
    }
  }
}

export function validateJson(input: string): JsonValidateResult {
  try {
    JSON.parse(input)
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: toErrorDetail(input, error)
    }
  }
}
