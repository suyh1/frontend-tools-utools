import { describe, expect, it } from 'vitest'
import { buildUrlFromParts, parseUrl, removeQueryItem, upsertQueryItem } from './url'

describe('url utils', () => {
  it('parses url into structured parts', () => {
    const result = parseUrl('https://example.com:8080/a/b?foo=1&bar=2#title')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.data.protocol).toBe('https:')
    expect(result.data.host).toBe('example.com:8080')
    expect(result.data.pathname).toBe('/a/b')
    expect(result.data.queryItems).toEqual([
      { key: 'foo', value: '1' },
      { key: 'bar', value: '2' }
    ])
  })

  it('builds url from editable parts', () => {
    const result = buildUrlFromParts({
      protocol: 'https:',
      host: 'example.com',
      pathname: '/docs',
      hash: 'tab1',
      queryItems: [
        { key: 'q', value: 'vite' },
        { key: 'lang', value: 'zh' }
      ]
    })

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.url).toBe('https://example.com/docs?q=vite&lang=zh#tab1')
  })

  it('updates and removes query items', () => {
    const initial = [
      { key: 'foo', value: '1' },
      { key: 'bar', value: '2' }
    ]

    const updated = upsertQueryItem(initial, 1, { key: 'bar', value: '99' })
    expect(updated).toEqual([
      { key: 'foo', value: '1' },
      { key: 'bar', value: '99' }
    ])

    const appended = upsertQueryItem(updated, -1, { key: 'new', value: 'x' })
    expect(appended).toHaveLength(3)

    const removed = removeQueryItem(appended, 0)
    expect(removed).toEqual([
      { key: 'bar', value: '99' },
      { key: 'new', value: 'x' }
    ])
  })

  it('returns error for invalid url', () => {
    const result = parseUrl('not-valid-url')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('URL 无法解析')
    }
  })
})
