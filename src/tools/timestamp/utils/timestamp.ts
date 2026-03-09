import type { TimestampConvertResult, TimestampParseResult, TimestampSourceUnit, TimestampView } from '@/tools/timestamp/types'

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function toLocalText(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

function toSourceUnitFromDigits(digitsLength: number): TimestampSourceUnit {
  return digitsLength <= 10 ? 'seconds' : 'milliseconds'
}

export function parseDateInput(input: string): TimestampParseResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return {
      ok: false,
      error: '输入为空，无法解析时间'
    }
  }

  if (/^-?\d+$/.test(trimmed)) {
    const numericValue = Number(trimmed)
    if (!Number.isFinite(numericValue)) {
      return {
        ok: false,
        error: '数值超出范围，无法解析时间'
      }
    }

    const digits = trimmed.replace(/^-/, '').length
    const sourceUnit = toSourceUnitFromDigits(digits)
    const timestampMs = sourceUnit === 'seconds' ? numericValue * 1000 : numericValue
    const date = new Date(timestampMs)

    if (Number.isNaN(date.getTime())) {
      return {
        ok: false,
        error: '时间戳无法解析为有效日期'
      }
    }

    return {
      ok: true,
      sourceUnit,
      timestampMs
    }
  }

  const parsedMs = Date.parse(trimmed)
  if (Number.isNaN(parsedMs)) {
    return {
      ok: false,
      error: '输入无法解析为日期或时间戳'
    }
  }

  return {
    ok: true,
    sourceUnit: 'datetime',
    timestampMs: parsedMs
  }
}

export function toRelativeLabel(targetMs: number, nowMs = Date.now()): string {
  const diffMs = targetMs - nowMs
  const absSeconds = Math.round(Math.abs(diffMs) / 1000)

  if (absSeconds < 5) {
    return '刚刚'
  }

  const suffix = diffMs >= 0 ? '后' : '前'

  if (absSeconds < 60) {
    return `${absSeconds} 秒${suffix}`
  }

  if (absSeconds < 3600) {
    return `${Math.floor(absSeconds / 60)} 分钟${suffix}`
  }

  if (absSeconds < 86400) {
    return `${Math.floor(absSeconds / 3600)} 小时${suffix}`
  }

  return `${Math.floor(absSeconds / 86400)} 天${suffix}`
}

export function formatTimestampView(timestampMs: number, nowMs = Date.now()): TimestampView {
  const date = new Date(timestampMs)

  return {
    timestampMs: Math.trunc(timestampMs),
    timestampSec: Math.trunc(timestampMs / 1000),
    isoUtc: date.toISOString(),
    localText: toLocalText(date),
    relativeText: toRelativeLabel(timestampMs, nowMs)
  }
}

export function convertInputToTimestampView(input: string, nowMs = Date.now()): TimestampConvertResult {
  const parsed = parseDateInput(input)

  if (!parsed.ok) {
    return parsed
  }

  return {
    ok: true,
    sourceUnit: parsed.sourceUnit,
    view: formatTimestampView(parsed.timestampMs, nowMs)
  }
}
