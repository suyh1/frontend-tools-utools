import { describe, expect, it } from 'vitest'
import { createJwtTokenCodeValidator } from '@/tools/jwt/utils/jwt-editor-validator'

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function runValidator(input: string) {
  const validator = createJwtTokenCodeValidator()
  return await validator({
    value: input,
    language: 'markdown'
  })
}

describe('jwt editor validator', () => {
  it('returns diagnostic when token does not contain header and payload', async () => {
    const diagnostics = await runValidator('only-one-segment')
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0].message).toContain('header.payload')
  })

  it('returns diagnostic anchored to payload segment when payload is invalid', async () => {
    const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const diagnostics = await runValidator(`${header}.b@@.sig`)
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0].from).toBe(header.length + 1)
    expect(diagnostics[0].to).toBe(header.length + 4)
  })

  it('returns empty diagnostics for valid token', async () => {
    const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = toBase64Url(JSON.stringify({ sub: '100' }))
    const diagnostics = await runValidator(`${header}.${payload}.sig`)
    expect(diagnostics).toEqual([])
  })
})
