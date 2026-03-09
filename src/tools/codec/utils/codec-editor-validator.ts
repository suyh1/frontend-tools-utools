import type { CodeEditorDiagnostic, CodeEditorValidator } from '@/components/code-editor/types'
import { runCodecTransform } from '@/tools/codec/utils/codec'
import type { CodecMode } from '@/tools/codec/types'

interface CodecInputValidatorOptions {
  mode: CodecMode
  source?: string
  ignoreEmptyInput?: boolean
}

const modeLabelMap: Record<CodecMode, string> = {
  'url-encode': 'URL Encode',
  'url-decode': 'URL Decode',
  'base64-encode': 'Base64 Encode',
  'base64-decode': 'Base64 Decode',
  'html-encode': 'HTML Entity Encode',
  'html-decode': 'HTML Entity Decode',
  'unicode-escape': 'Unicode Escape',
  'unicode-unescape': 'Unicode Unescape'
}

function shouldValidateDecodeInput(mode: CodecMode): boolean {
  return mode === 'url-decode' || mode === 'base64-decode'
}

function toDiagnostic(input: string, mode: CodecMode, message: string, source: string): CodeEditorDiagnostic {
  return {
    from: 0,
    to: input.length > 0 ? 1 : 0,
    source,
    severity: 'error',
    message: `${modeLabelMap[mode]} 输入无效：${message}`
  }
}

export function createCodecInputCodeValidator(options: CodecInputValidatorOptions): CodeEditorValidator {
  const source = options.source ?? 'codec'
  const ignoreEmptyInput = options.ignoreEmptyInput ?? false

  return ({ value }) => {
    if (ignoreEmptyInput && value.trim().length === 0) {
      return []
    }

    if (!shouldValidateDecodeInput(options.mode)) {
      return []
    }

    const result = runCodecTransform(value, options.mode)
    if (result.ok) {
      return []
    }

    return [toDiagnostic(value, options.mode, result.error, source)]
  }
}
