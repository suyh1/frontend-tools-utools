import type { RegexAnalyzeResult, RegexMatchItem, RegexReplaceResult } from '@/tools/regex/types'

function toRegexError(error: unknown): string {
  if (error instanceof Error) {
    return `正则表达式无效：${error.message}`
  }
  return '正则表达式无效'
}

function toMatchItem(match: RegExpExecArray): RegexMatchItem {
  const namedGroups: Record<string, string> = {}

  if (match.groups) {
    for (const [key, value] of Object.entries(match.groups)) {
      namedGroups[key] = value ?? ''
    }
  }

  return {
    value: match[0] ?? '',
    index: match.index,
    groups: match.slice(1).map((item) => item ?? ''),
    namedGroups
  }
}

export function analyzeRegex(pattern: string, flags: string, input: string): RegexAnalyzeResult {
  let regex: RegExp

  try {
    regex = new RegExp(pattern, flags)
  } catch (error) {
    return {
      ok: false,
      error: toRegexError(error)
    }
  }

  const matches: RegexMatchItem[] = []

  if (regex.global) {
    let current: RegExpExecArray | null = regex.exec(input)

    while (current) {
      matches.push(toMatchItem(current))

      if (current[0] === '') {
        regex.lastIndex += 1
      }

      current = regex.exec(input)
    }
  } else {
    const current = regex.exec(input)
    if (current) {
      matches.push(toMatchItem(current))
    }
  }

  return {
    ok: true,
    matches
  }
}

export function previewRegexReplace(pattern: string, flags: string, input: string, replacement: string): RegexReplaceResult {
  try {
    const regex = new RegExp(pattern, flags)
    return {
      ok: true,
      output: input.replace(regex, replacement)
    }
  } catch (error) {
    return {
      ok: false,
      error: toRegexError(error)
    }
  }
}
