import type { ToolDefinition } from '@/tools/types'

type EnterAction = {
  code?: string
  type?: string
  payload?: unknown
  option?: unknown
}

function extractText(action: EnterAction): string {
  const parts: string[] = []

  if (typeof action.code === 'string') {
    parts.push(action.code)
  }

  if (typeof action.payload === 'string') {
    parts.push(action.payload)
  }

  if (typeof action.option === 'string') {
    parts.push(action.option)
  }

  if (action.option && typeof action.option === 'object') {
    const optionObject = action.option as Record<string, unknown>
    const cmd = optionObject.cmd
    if (typeof cmd === 'string') {
      parts.push(cmd)
    }
  }

  return parts.join(' ').toLowerCase()
}

export function resolveToolIdFromEnterAction(action: EnterAction, tools: ToolDefinition[]): string | null {
  if (!action) {
    return null
  }

  if (typeof action.code === 'string') {
    const directMatch = tools.find((tool) => tool.id === action.code)
    if (directMatch) {
      return directMatch.id
    }
  }

  const text = extractText(action)
  if (!text) {
    return null
  }

  const keywordMatch = tools.find((tool) =>
    tool.keywords.some((keyword) => text.includes(keyword.toLowerCase()))
  )

  return keywordMatch ? keywordMatch.id : null
}

export function resolveInitialToolId(
  action: EnterAction,
  tools: ToolDefinition[],
  fallbackToolId: string
): string {
  return resolveToolIdFromEnterAction(action, tools) ?? fallbackToolId
}
