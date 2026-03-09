import { computed, ref } from 'vue'
import { parseJwtToken } from '@/tools/jwt/utils/jwt'
import type { JwtStatus, JwtTimeFields } from '@/tools/jwt/types'

interface JwtTimeRow {
  key: string
  epochSeconds: number
  isoUtc: string
  localText: string
  relativeText: string
}

const DEFAULT_STATUS: JwtStatus = {
  expired: false,
  notYetValid: false
}

export function useJwtTool() {
  const token = ref('')
  const headerText = ref('')
  const payloadText = ref('')
  const signature = ref('')
  const timeFields = ref<JwtTimeFields>({})
  const status = ref<JwtStatus>(DEFAULT_STATUS)
  const error = ref<string | null>(null)

  const timeRows = computed<JwtTimeRow[]>(() => {
    const rows: JwtTimeRow[] = []

    for (const key of ['iat', 'nbf', 'exp'] as const) {
      const field = timeFields.value[key]
      if (!field) {
        continue
      }

      rows.push({
        key,
        epochSeconds: field.epochSeconds,
        isoUtc: field.isoUtc,
        localText: field.localText,
        relativeText: field.relativeText
      })
    }

    return rows
  })

  function runParse() {
    const result = parseJwtToken(token.value)

    if (!result.ok) {
      error.value = result.error
      headerText.value = ''
      payloadText.value = ''
      signature.value = ''
      timeFields.value = {}
      status.value = DEFAULT_STATUS
      return
    }

    error.value = null
    headerText.value = JSON.stringify(result.data.header, null, 2)
    payloadText.value = JSON.stringify(result.data.payload, null, 2)
    signature.value = result.data.signature
    timeFields.value = result.data.timeFields
    status.value = result.data.status
  }

  function reset() {
    token.value = ''
    headerText.value = ''
    payloadText.value = ''
    signature.value = ''
    timeFields.value = {}
    status.value = DEFAULT_STATUS
    error.value = null
  }

  return {
    token,
    headerText,
    payloadText,
    signature,
    timeRows,
    status,
    error,
    runParse,
    reset
  }
}
