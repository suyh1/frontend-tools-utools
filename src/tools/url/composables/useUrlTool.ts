import { ref } from 'vue'
import { buildUrlFromParts, parseUrl, removeQueryItem, upsertQueryItem } from '@/tools/url/utils/url'
import type { UrlQueryItem } from '@/tools/url/types'

export function useUrlTool() {
  const sourceUrl = ref('')

  const protocol = ref('https:')
  const host = ref('')
  const pathname = ref('/')
  const hash = ref('')
  const queryItems = ref<UrlQueryItem[]>([])

  const outputUrl = ref('')
  const error = ref<string | null>(null)

  function parseInput() {
    const parsed = parseUrl(sourceUrl.value)

    if (!parsed.ok) {
      error.value = parsed.error
      return
    }

    error.value = null
    protocol.value = parsed.data.protocol
    host.value = parsed.data.host
    pathname.value = parsed.data.pathname
    hash.value = parsed.data.hash
    queryItems.value = parsed.data.queryItems.length ? parsed.data.queryItems : []
    outputUrl.value = parsed.data.href
  }

  function buildOutput() {
    const built = buildUrlFromParts({
      protocol: protocol.value,
      host: host.value,
      pathname: pathname.value,
      hash: hash.value,
      queryItems: queryItems.value
    })

    if (!built.ok) {
      error.value = built.error
      return
    }

    error.value = null
    outputUrl.value = built.url
    sourceUrl.value = built.url
  }

  function addQueryItem() {
    queryItems.value = upsertQueryItem(queryItems.value, -1, { key: '', value: '' })
  }

  function updateQueryItem(index: number, field: 'key' | 'value', value: string) {
    const current = queryItems.value[index] ?? { key: '', value: '' }
    queryItems.value = upsertQueryItem(queryItems.value, index, {
      ...current,
      [field]: value
    })
  }

  function deleteQueryItem(index: number) {
    queryItems.value = removeQueryItem(queryItems.value, index)
  }

  function reset() {
    sourceUrl.value = ''
    protocol.value = 'https:'
    host.value = ''
    pathname.value = '/'
    hash.value = ''
    queryItems.value = []
    outputUrl.value = ''
    error.value = null
  }

  return {
    sourceUrl,
    protocol,
    host,
    pathname,
    hash,
    queryItems,
    outputUrl,
    error,
    parseInput,
    buildOutput,
    addQueryItem,
    updateQueryItem,
    deleteQueryItem,
    reset
  }
}
