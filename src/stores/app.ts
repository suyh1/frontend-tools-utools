import { defineStore } from 'pinia'

export type JsonIndent = 2 | 4

export interface AppPreferences {
  jsonIndent: JsonIndent
}

const DEFAULT_TOOL_ID = 'json'

export const useAppStore = defineStore('app', {
  state: () => ({
    activeToolId: DEFAULT_TOOL_ID,
    recentTools: [DEFAULT_TOOL_ID] as string[],
    preferences: {
      jsonIndent: 2
    } as AppPreferences
  }),
  actions: {
    setActiveTool(toolId: string) {
      this.activeToolId = toolId
      this.touchTool(toolId)
    },
    touchTool(toolId: string) {
      this.recentTools = [toolId, ...this.recentTools.filter((id) => id !== toolId)].slice(0, 8)
    },
    setJsonIndent(indent: JsonIndent) {
      this.preferences.jsonIndent = indent
    }
  }
})
