import { ref } from 'vue'
import { analyzeRegex, previewRegexReplace } from '@/tools/regex/utils/regex'
import type { RegexMatchItem } from '@/tools/regex/types'

export function useRegexTool() {
  const pattern = ref('')
  const flags = ref('g')
  const input = ref('')
  const replacement = ref('')

  const matches = ref<RegexMatchItem[]>([])
  const replaceOutput = ref('')
  const error = ref<string | null>(null)

  function runMatch() {
    const result = analyzeRegex(pattern.value, flags.value, input.value)

    if (!result.ok) {
      error.value = result.error
      matches.value = []
      return
    }

    error.value = null
    matches.value = result.matches
  }

  function runReplace() {
    const result = previewRegexReplace(pattern.value, flags.value, input.value, replacement.value)

    if (!result.ok) {
      error.value = result.error
      replaceOutput.value = ''
      return
    }

    error.value = null
    replaceOutput.value = result.output
  }

  function reset() {
    pattern.value = ''
    flags.value = 'g'
    input.value = ''
    replacement.value = ''
    matches.value = []
    replaceOutput.value = ''
    error.value = null
  }

  return {
    pattern,
    flags,
    input,
    replacement,
    matches,
    replaceOutput,
    error,
    runMatch,
    runReplace,
    reset
  }
}
