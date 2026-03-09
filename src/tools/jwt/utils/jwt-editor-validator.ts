import type { CodeEditorDiagnostic, CodeEditorValidator } from '@/components/code-editor/types'

interface JwtTokenValidatorOptions {
  source?: string
  ignoreEmptyInput?: boolean
}

interface SegmentRange {
  from: number
  to: number
}

function decodeBase64UrlSegment(segment: string): string {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)

  if (!/^[A-Za-z0-9+/]+=*$/.test(padded)) {
    throw new Error('Base64Url 字段不合法')
  }

  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function parseJsonObjectSegment(segment: string, label: string): Record<string, unknown> {
  const decoded = decodeBase64UrlSegment(segment)
  const parsed = JSON.parse(decoded)

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} 不是有效 JSON 对象`)
  }

  return parsed as Record<string, unknown>
}

function findTrimmedTokenRange(input: string): SegmentRange | null {
  let start = 0
  let end = input.length

  while (start < end && /\s/.test(input[start])) {
    start += 1
  }

  while (end > start && /\s/.test(input[end - 1])) {
    end -= 1
  }

  if (start >= end) {
    return null
  }

  return { from: start, to: end }
}

function buildSegmentRanges(token: string, offset: number): SegmentRange[] {
  const segments = token.split('.')
  const ranges: SegmentRange[] = []
  let cursor = 0

  for (const segment of segments) {
    const from = offset + cursor
    const to = from + segment.length
    ranges.push({ from, to })
    cursor += segment.length + 1
  }

  return ranges
}

function toDiagnostic(range: SegmentRange, message: string, source: string): CodeEditorDiagnostic {
  return {
    from: range.from,
    to: range.to,
    source,
    severity: 'error',
    message: `JWT 校验失败：${message}`
  }
}

export function createJwtTokenCodeValidator(options: JwtTokenValidatorOptions = {}): CodeEditorValidator {
  const source = options.source ?? 'jwt'
  const ignoreEmptyInput = options.ignoreEmptyInput ?? true

  return ({ value }) => {
    const trimmedRange = findTrimmedTokenRange(value)

    if (!trimmedRange) {
      return ignoreEmptyInput
        ? []
        : [toDiagnostic({ from: 0, to: 0 }, 'JWT 格式无效：输入为空', source)]
    }

    const token = value.slice(trimmedRange.from, trimmedRange.to)
    const segments = token.split('.')
    const segmentRanges = buildSegmentRanges(token, trimmedRange.from)
    const fullRange = { from: trimmedRange.from, to: trimmedRange.to }

    if (segments.length < 2) {
      return [toDiagnostic(fullRange, 'JWT 格式无效：需要至少包含 header.payload', source)]
    }

    try {
      parseJsonObjectSegment(segments[0], 'Header')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Header 解析失败'
      return [toDiagnostic(segmentRanges[0] ?? fullRange, message, source)]
    }

    try {
      parseJsonObjectSegment(segments[1], 'Payload')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payload 解析失败'
      return [toDiagnostic(segmentRanges[1] ?? fullRange, message, source)]
    }

    return []
  }
}
