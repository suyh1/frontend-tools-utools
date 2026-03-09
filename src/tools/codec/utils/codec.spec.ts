import { describe, expect, it } from 'vitest'
import { runCodecTransform } from './codec'

describe('codec utils', () => {
  it('encodes and decodes url text', () => {
    const encoded = runCodecTransform('hello world', 'url-encode')
    expect(encoded.ok).toBe(true)
    if (!encoded.ok) {
      return
    }

    const decoded = runCodecTransform(encoded.output, 'url-decode')
    expect(decoded.ok).toBe(true)
    if (!decoded.ok) {
      return
    }
    expect(decoded.output).toBe('hello world')
  })

  it('encodes and decodes base64 text', () => {
    const encoded = runCodecTransform('你好', 'base64-encode')
    expect(encoded.ok).toBe(true)
    if (!encoded.ok) {
      return
    }

    const decoded = runCodecTransform(encoded.output, 'base64-decode')
    expect(decoded.ok).toBe(true)
    if (!decoded.ok) {
      return
    }
    expect(decoded.output).toBe('你好')
  })

  it('encodes and decodes html entities', () => {
    const encoded = runCodecTransform('<div>&"</div>', 'html-encode')
    expect(encoded.ok).toBe(true)
    if (!encoded.ok) {
      return
    }
    expect(encoded.output).toContain('&lt;div&gt;')

    const decoded = runCodecTransform(encoded.output, 'html-decode')
    expect(decoded.ok).toBe(true)
    if (!decoded.ok) {
      return
    }
    expect(decoded.output).toBe('<div>&"</div>')
  })

  it('encodes and decodes unicode escape sequence', () => {
    const escaped = runCodecTransform('Hi中', 'unicode-escape')
    expect(escaped.ok).toBe(true)
    if (!escaped.ok) {
      return
    }
    expect(escaped.output).toContain('\\u4e2d')

    const unescaped = runCodecTransform(escaped.output, 'unicode-unescape')
    expect(unescaped.ok).toBe(true)
    if (!unescaped.ok) {
      return
    }
    expect(unescaped.output).toBe('Hi中')
  })

  it('returns error for invalid decode content', () => {
    const urlDecoded = runCodecTransform('%', 'url-decode')
    expect(urlDecoded.ok).toBe(false)

    const base64Decoded = runCodecTransform('###', 'base64-decode')
    expect(base64Decoded.ok).toBe(false)
  })
})
