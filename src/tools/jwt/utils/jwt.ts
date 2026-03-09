import type { JwtParseResult, JwtTimeField, JwtTimeFields } from '@/tools/jwt/types'

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function formatLocal(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

function toRelativeLabel(targetMs: number, nowMs: number): string {
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

function parseJsonObject(segment: string, label: string): Record<string, unknown> {
  const decoded = decodeBase64UrlSegment(segment)
  const parsed = JSON.parse(decoded)

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} 不是有效 JSON 对象`)
  }

  return parsed as Record<string, unknown>
}

function toJwtTimeField(value: unknown, nowMs: number): JwtTimeField | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined
  }

  const epochSeconds = Math.trunc(value)
  const date = new Date(epochSeconds * 1000)

  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  return {
    epochSeconds,
    isoUtc: date.toISOString(),
    localText: formatLocal(date),
    relativeText: toRelativeLabel(date.getTime(), nowMs)
  }
}

export function resolveJwtTimeFields(payload: Record<string, unknown>, nowMs = Date.now()): JwtTimeFields {
  return {
    iat: toJwtTimeField(payload.iat, nowMs),
    nbf: toJwtTimeField(payload.nbf, nowMs),
    exp: toJwtTimeField(payload.exp, nowMs)
  }
}

export function parseJwtToken(token: string, nowMs = Date.now()): JwtParseResult {
  const trimmed = token.trim()

  if (!trimmed) {
    return {
      ok: false,
      error: 'JWT 格式无效：输入为空'
    }
  }

  const segments = trimmed.split('.')

  if (segments.length < 2) {
    return {
      ok: false,
      error: 'JWT 格式无效：需要至少包含 header.payload'
    }
  }

  try {
    const header = parseJsonObject(segments[0], 'Header')
    const payload = parseJsonObject(segments[1], 'Payload')
    const signature = segments[2] ?? ''

    const timeFields = resolveJwtTimeFields(payload, nowMs)
    const expSeconds = typeof payload.exp === 'number' ? payload.exp : null
    const nbfSeconds = typeof payload.nbf === 'number' ? payload.nbf : null

    return {
      ok: true,
      data: {
        header,
        payload,
        signature,
        timeFields,
        status: {
          expired: expSeconds !== null ? nowMs >= expSeconds * 1000 : false,
          notYetValid: nbfSeconds !== null ? nowMs < nbfSeconds * 1000 : false
        }
      }
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'JWT 解析失败'
    }
  }
}
