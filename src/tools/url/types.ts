export interface UrlQueryItem {
  key: string
  value: string
}

export interface ParsedUrlData {
  protocol: string
  host: string
  hostname: string
  port: string
  pathname: string
  hash: string
  queryItems: UrlQueryItem[]
  origin: string
  href: string
}

export interface UrlEditableParts {
  protocol: string
  host: string
  pathname: string
  hash: string
  queryItems: UrlQueryItem[]
}

export type UrlParseResult =
  | {
      ok: true
      data: ParsedUrlData
    }
  | {
      ok: false
      error: string
    }

export type UrlBuildResult =
  | {
      ok: true
      url: string
    }
  | {
      ok: false
      error: string
    }
