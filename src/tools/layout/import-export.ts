import type { ToolLayoutConfigV1, ToolLayoutGroup } from '@/tools/layout/types'

interface LayoutValidationSuccess {
  ok: true
  config: ToolLayoutConfigV1
}

interface LayoutValidationFailure {
  ok: false
  error: string
}

export type LayoutValidationResult = LayoutValidationSuccess | LayoutValidationFailure

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function parseGroup(value: unknown): ToolLayoutGroup | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const group = value as Record<string, unknown>
  if (typeof group.id !== 'string' || !group.id.trim()) {
    return null
  }

  if (typeof group.name !== 'string' || !group.name.trim()) {
    return null
  }

  if (!isStringArray(group.toolIds)) {
    return null
  }

  const order = Number.isFinite(group.order) ? Number(group.order) : 0

  return {
    id: group.id.trim(),
    name: group.name.trim(),
    order,
    toolIds: group.toolIds
  }
}

function parseStringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') {
    return {}
  }

  const result: Record<string, string> = {}
  for (const [key, current] of Object.entries(value as Record<string, unknown>)) {
    if (typeof current !== 'string') {
      continue
    }
    result[key] = current
  }
  return result
}

export function validateImportedToolLayout(payload: unknown): LayoutValidationResult {
  if (!payload || typeof payload !== 'object') {
    return {
      ok: false,
      error: '配置格式无效：顶层结构不是对象'
    }
  }

  const current = payload as Record<string, unknown>
  if (current.version !== 1) {
    return {
      ok: false,
      error: '配置版本不支持，仅支持 version=1'
    }
  }

  if (!Array.isArray(current.groups)) {
    return {
      ok: false,
      error: '配置格式无效：groups 不是数组'
    }
  }

  const groups: ToolLayoutGroup[] = []
  for (const group of current.groups) {
    const parsed = parseGroup(group)
    if (!parsed) {
      return {
        ok: false,
        error: '配置格式无效：存在非法分组定义'
      }
    }
    groups.push(parsed)
  }

  const favorites = isStringArray(current.favorites) ? current.favorites : []
  const hiddenTools = isStringArray(current.hiddenTools) ? current.hiddenTools : []

  return {
    ok: true,
    config: {
      version: 1,
      groups,
      favorites,
      hiddenTools,
      aliases: parseStringMap(current.aliases),
      icons: parseStringMap(current.icons)
    }
  }
}

export function parseImportedToolLayoutText(text: string): LayoutValidationResult {
  try {
    const parsed = JSON.parse(text) as unknown
    return validateImportedToolLayout(parsed)
  } catch {
    return {
      ok: false,
      error: '配置解析失败：不是合法 JSON'
    }
  }
}

export function serializeToolLayoutConfig(config: ToolLayoutConfigV1): string {
  return JSON.stringify(config, null, 2)
}
