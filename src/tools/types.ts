import type { Component } from 'vue'

export interface ToolDefinition {
  id: string
  name: string
  icon: string
  keywords: string[]
  order: number
  groupId: string
  groupName: string
  groupOrder: number
  defaultFavorite?: boolean
  component: Component
}
