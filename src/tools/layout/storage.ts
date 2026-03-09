import type { ToolLayoutConfigV1 } from '@/tools/layout/types'
import { validateImportedToolLayout } from '@/tools/layout/import-export'

const TOOL_LAYOUT_STORAGE_KEY = 'frontend-tools.layout.v1'

function parseJsonValue(value: unknown): ToolLayoutConfigV1 | null {
  if (!value) {
    return null
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      const result = validateImportedToolLayout(parsed)
      return result.ok ? result.config : null
    } catch {
      return null
    }
  }

  const result = validateImportedToolLayout(value)
  return result.ok ? result.config : null
}

function readFromUtools(): ToolLayoutConfigV1 | null {
  try {
    const value = window.utools?.dbStorage?.getItem?.(TOOL_LAYOUT_STORAGE_KEY)
    return parseJsonValue(value)
  } catch {
    return null
  }
}

function readFromLocalStorage(): ToolLayoutConfigV1 | null {
  try {
    return parseJsonValue(localStorage.getItem(TOOL_LAYOUT_STORAGE_KEY))
  } catch {
    return null
  }
}

function writeToUtools(config: ToolLayoutConfigV1) {
  try {
    window.utools?.dbStorage?.setItem?.(TOOL_LAYOUT_STORAGE_KEY, config)
  } catch {
    // Best effort: fallback storage still writes.
  }
}

function writeToLocalStorage(config: ToolLayoutConfigV1) {
  try {
    localStorage.setItem(TOOL_LAYOUT_STORAGE_KEY, JSON.stringify(config))
  } catch {
    // Ignore quota errors in sandboxed environments.
  }
}

export function loadToolLayoutConfig(): ToolLayoutConfigV1 | null {
  return readFromUtools() ?? readFromLocalStorage()
}

export function saveToolLayoutConfig(config: ToolLayoutConfigV1) {
  writeToUtools(config)
  writeToLocalStorage(config)
}

export function clearToolLayoutConfig() {
  try {
    window.utools?.dbStorage?.removeItem?.(TOOL_LAYOUT_STORAGE_KEY)
  } catch {
    // noop
  }

  try {
    localStorage.removeItem(TOOL_LAYOUT_STORAGE_KEY)
  } catch {
    // noop
  }
}

export { TOOL_LAYOUT_STORAGE_KEY }
