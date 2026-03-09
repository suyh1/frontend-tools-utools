export interface ToolLayoutGroup {
  id: string
  name: string
  order: number
  toolIds: string[]
}

export interface ToolLayoutConfigV1 {
  version: 1
  groups: ToolLayoutGroup[]
  favorites: string[]
  hiddenTools: string[]
  aliases: Record<string, string>
  icons: Record<string, string>
}

export interface ToolLayoutGroupView {
  id: string
  name: string
  toolIds: string[]
}

export interface ToolDisplayInfo {
  id: string
  name: string
  icon: string
  keywords: string[]
}
