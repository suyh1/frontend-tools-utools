import type { UrlBuildResult, UrlEditableParts, UrlParseResult, UrlQueryItem } from '@/tools/url/types'

function normalizeProtocol(protocol: string): string {
  const trimmed = protocol.trim()

  if (!trimmed) {
    return 'https:'
  }

  return trimmed.endsWith(':') ? trimmed : `${trimmed}:`
}

export function parseUrl(input: string): UrlParseResult {
  const trimmed = input.trim()

  if (!trimmed) {
    return {
      ok: false,
      error: 'URL 无法解析：输入为空'
    }
  }

  try {
    const url = new URL(trimmed)
    return {
      ok: true,
      data: {
        protocol: url.protocol,
        host: url.host,
        hostname: url.hostname,
        port: url.port,
        pathname: url.pathname,
        hash: url.hash.replace(/^#/, ''),
        queryItems: Array.from(url.searchParams.entries()).map(([key, value]) => ({ key, value })),
        origin: url.origin,
        href: url.href
      }
    }
  } catch {
    return {
      ok: false,
      error: 'URL 无法解析，请输入完整链接（含协议）'
    }
  }
}

export function buildUrlFromParts(parts: UrlEditableParts): UrlBuildResult {
  const host = parts.host.trim()

  if (!host) {
    return {
      ok: false,
      error: 'Host 不能为空'
    }
  }

  const protocol = normalizeProtocol(parts.protocol)

  try {
    const url = new URL(`${protocol}//${host}`)

    const rawPathname = parts.pathname.trim()
    if (rawPathname) {
      url.pathname = rawPathname.startsWith('/') ? rawPathname : `/${rawPathname}`
    }

    url.search = ''
    for (const item of parts.queryItems) {
      const key = item.key.trim()
      if (!key) {
        continue
      }
      url.searchParams.append(key, item.value)
    }

    const hashText = parts.hash.trim()
    url.hash = hashText ? hashText.replace(/^#/, '') : ''

    return {
      ok: true,
      url: url.toString()
    }
  } catch {
    return {
      ok: false,
      error: 'URL 构建失败，请检查输入字段'
    }
  }
}

export function upsertQueryItem(items: UrlQueryItem[], index: number, next: UrlQueryItem): UrlQueryItem[] {
  const copied = [...items]

  if (index >= 0 && index < copied.length) {
    copied[index] = next
    return copied
  }

  copied.push(next)
  return copied
}

export function removeQueryItem(items: UrlQueryItem[], index: number): UrlQueryItem[] {
  if (index < 0 || index >= items.length) {
    return [...items]
  }

  return items.filter((_, currentIndex) => currentIndex !== index)
}
