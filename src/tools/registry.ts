import { defineAsyncComponent } from 'vue'
import type { ToolDefinition } from '@/tools/types'

const JsonTool = defineAsyncComponent(() => import('@/tools/json/JsonTool.vue'))
const ColorTool = defineAsyncComponent(() => import('@/tools/color/ColorTool.vue'))

export const toolRegistry: ToolDefinition[] = [
  {
    id: 'json',
    name: 'JSON 工具',
    icon: 'J',
    keywords: ['json', '格式化', '压缩', '校验'],
    order: 1,
    component: JsonTool
  },
  {
    id: 'color',
    name: '颜色工具',
    icon: 'C',
    keywords: ['颜色', '色值', '渐变', '对比度', 'hex', 'rgb', 'hsl'],
    order: 2,
    component: ColorTool
  }
]

export const toolRegistryMap = new Map(toolRegistry.map((tool) => [tool.id, tool]))
