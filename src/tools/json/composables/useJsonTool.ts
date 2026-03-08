import { computed, ref } from 'vue'
import { copyTextToClipboard } from '@/composables/useClipboard'
import { useAppStore, type JsonIndent } from '@/stores/app'
import { formatJson, minifyJson, validateJson } from '@/tools/json/utils/json'
import type { JsonErrorDetail } from '@/tools/json/types'

export function useJsonTool() {
  const appStore = useAppStore()

  const input = ref('')
  const output = ref('')
  const error = ref<JsonErrorDetail | null>(null)
  const validated = ref<boolean | null>(null)

  const indent = computed({
    get: () => appStore.preferences.jsonIndent,
    set: (value: JsonIndent) => appStore.setJsonIndent(value)
  })

  function clearErrorState() {
    error.value = null
    validated.value = null
  }

  function runFormat() {
    const result = formatJson(input.value, indent.value)
    if (result.ok) {
      output.value = result.output
      clearErrorState()
      return
    }

    error.value = result.error
  }

  function runMinify() {
    const result = minifyJson(input.value)
    if (result.ok) {
      output.value = result.output
      clearErrorState()
      return
    }

    error.value = result.error
  }

  function runValidate() {
    const result = validateJson(input.value)
    if (result.ok) {
      clearErrorState()
      validated.value = true
      return
    }

    validated.value = false
    error.value = result.error
  }

  function reset() {
    input.value = ''
    output.value = ''
    clearErrorState()
  }

  async function copyOutput() {
    return copyTextToClipboard(output.value)
  }

  return {
    indent,
    input,
    output,
    error,
    validated,
    runFormat,
    runMinify,
    runValidate,
    reset,
    copyOutput
  }
}
