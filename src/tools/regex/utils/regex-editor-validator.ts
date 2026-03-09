import type { CodeEditorDiagnostic, CodeEditorValidator } from '@/components/code-editor/types'

interface RegexInputValidatorOptions {
  pattern: string
  flags: string
  source?: string
  ignoreEmptyInput?: boolean
}

function toDiagnostic(input: string, message: string, source: string): CodeEditorDiagnostic {
  const from = 0
  const to = input.length > 0 ? 1 : 0

  return {
    from,
    to,
    source,
    severity: 'error',
    message
  }
}

export function createRegexInputCodeValidator(options: RegexInputValidatorOptions): CodeEditorValidator {
  const source = options.source ?? 'regex'
  const ignoreEmptyInput = options.ignoreEmptyInput ?? false

  return ({ value }) => {
    if (ignoreEmptyInput && value.trim().length === 0) {
      return []
    }

    try {
      new RegExp(options.pattern, options.flags)
      return []
    } catch (error) {
      const detail = error instanceof Error ? error.message : '正则表达式无效'
      return [toDiagnostic(value, `正则表达式无效：${detail}`, source)]
    }
  }
}
