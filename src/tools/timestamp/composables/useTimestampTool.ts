import { computed, ref } from 'vue'
import { convertInputToTimestampView } from '@/tools/timestamp/utils/timestamp'
import type { TimestampSourceUnit, TimestampView } from '@/tools/timestamp/types'

const sourceUnitLabelMap: Record<TimestampSourceUnit, string> = {
  seconds: '秒级时间戳',
  milliseconds: '毫秒级时间戳',
  datetime: '日期字符串'
}

export function useTimestampTool() {
  const input = ref('')
  const result = ref<TimestampView | null>(null)
  const sourceUnit = ref<TimestampSourceUnit | null>(null)
  const error = ref<string | null>(null)

  const sourceLabel = computed(() => {
    if (!sourceUnit.value) {
      return ''
    }
    return sourceUnitLabelMap[sourceUnit.value]
  })

  function runConvert() {
    const converted = convertInputToTimestampView(input.value)

    if (!converted.ok) {
      error.value = converted.error
      result.value = null
      sourceUnit.value = null
      return
    }

    error.value = null
    result.value = converted.view
    sourceUnit.value = converted.sourceUnit
  }

  function setNowSeconds() {
    input.value = String(Math.floor(Date.now() / 1000))
    runConvert()
  }

  function setNowMilliseconds() {
    input.value = String(Date.now())
    runConvert()
  }

  function reset() {
    input.value = ''
    result.value = null
    sourceUnit.value = null
    error.value = null
  }

  return {
    input,
    result,
    sourceLabel,
    error,
    runConvert,
    setNowSeconds,
    setNowMilliseconds,
    reset
  }
}
