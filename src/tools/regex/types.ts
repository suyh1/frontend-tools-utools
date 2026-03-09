export interface RegexMatchItem {
  value: string
  index: number
  groups: string[]
  namedGroups: Record<string, string>
}

export type RegexAnalyzeResult =
  | {
      ok: true
      matches: RegexMatchItem[]
    }
  | {
      ok: false
      error: string
    }

export type RegexReplaceResult =
  | {
      ok: true
      output: string
    }
  | {
      ok: false
      error: string
    }
