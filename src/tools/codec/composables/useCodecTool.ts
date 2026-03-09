import { ref } from 'vue'
import { runCodecTransform } from '@/tools/codec/utils/codec'
import type { CodecMode } from '@/tools/codec/types'

export function useCodecTool() {
  const mode = ref<CodecMode>('url-encode')
  const input = ref('')
  const output = ref('')
  const error = ref<string | null>(null)

  function runTransform() {
    const result = runCodecTransform(input.value, mode.value)

    if (!result.ok) {
      error.value = result.error
      return
    }

    error.value = null
    output.value = result.output
  }

  function reset() {
    input.value = ''
    output.value = ''
    error.value = null
  }

  return {
    mode,
    input,
    output,
    error,
    runTransform,
    reset
  }
}
