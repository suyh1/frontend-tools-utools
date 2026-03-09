import type { CodecMode, CodecTransformResult } from '@/tools/codec/types'

const htmlEncodeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

const htmlDecodeMap: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'"
}

function encodeToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function decodeFromBase64(text: string): string {
  const normalized = text.trim()

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
    throw new Error('Base64 输入不合法')
  }

  const binary = atob(normalized)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function encodeHtmlEntity(text: string): string {
  return text.replace(/[&<>"']/g, (char) => htmlEncodeMap[char] ?? char)
}

function decodeHtmlEntity(text: string): string {
  return text.replace(/&(amp|lt|gt|quot|#39);/g, (entity) => htmlDecodeMap[entity] ?? entity)
}

function unicodeEscape(text: string): string {
  return text
    .split('')
    .map((char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`)
    .join('')
}

function unicodeUnescape(text: string): string {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
}

export function runCodecTransform(input: string, mode: CodecMode): CodecTransformResult {
  try {
    let output = ''

    switch (mode) {
      case 'url-encode':
        output = encodeURIComponent(input)
        break
      case 'url-decode':
        output = decodeURIComponent(input)
        break
      case 'base64-encode':
        output = encodeToBase64(input)
        break
      case 'base64-decode':
        output = decodeFromBase64(input)
        break
      case 'html-encode':
        output = encodeHtmlEntity(input)
        break
      case 'html-decode':
        output = decodeHtmlEntity(input)
        break
      case 'unicode-escape':
        output = unicodeEscape(input)
        break
      case 'unicode-unescape':
        output = unicodeUnescape(input)
        break
      default:
        output = input
    }

    return {
      ok: true,
      output
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : '编码/解码失败'
    }
  }
}
