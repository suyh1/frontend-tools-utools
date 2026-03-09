import { describe, expect, it } from 'vitest'
import { parseJwtToken } from './jwt'

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function createJwt(payload: Record<string, unknown>) {
  const header = { alg: 'HS256', typ: 'JWT' }
  return `${toBase64Url(JSON.stringify(header))}.${toBase64Url(JSON.stringify(payload))}.signature`
}

describe('jwt utils', () => {
  it('parses jwt header and payload', () => {
    const token = createJwt({ sub: '100', iat: 1700000000, exp: 2000000000 })
    const result = parseJwtToken(token, 1800000000 * 1000)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.data.header.alg).toBe('HS256')
    expect(result.data.payload.sub).toBe('100')
    expect(result.data.timeFields.exp?.epochSeconds).toBe(2000000000)
    expect(result.data.status.expired).toBe(false)
  })

  it('marks token as expired when now is after exp', () => {
    const token = createJwt({ exp: 1700000000 })
    const result = parseJwtToken(token, 1800000000 * 1000)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.data.status.expired).toBe(true)
  })

  it('returns error for malformed token', () => {
    const result = parseJwtToken('bad-token')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('JWT 格式无效')
    }
  })

  it('returns error for invalid payload encoding', () => {
    const result = parseJwtToken('a.@@.c')
    expect(result.ok).toBe(false)
  })
})
