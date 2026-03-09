import { defineAsyncComponent } from 'vue'
import type { ToolDefinition } from '@/tools/types'

const JsonTool = defineAsyncComponent(() => import('@/tools/json/JsonTool.vue'))
const ColorTool = defineAsyncComponent(() => import('@/tools/color/ColorTool.vue'))
const TimestampTool = defineAsyncComponent(() => import('@/tools/timestamp/TimestampTool.vue'))
const CodecTool = defineAsyncComponent(() => import('@/tools/codec/CodecTool.vue'))
const RegexTool = defineAsyncComponent(() => import('@/tools/regex/RegexTool.vue'))
const UrlTool = defineAsyncComponent(() => import('@/tools/url/UrlTool.vue'))
const JwtTool = defineAsyncComponent(() => import('@/tools/jwt/JwtTool.vue'))

export const toolRegistry: ToolDefinition[] = [
  {
    id: 'json',
    name: 'JSON 工具',
    icon: 'J',
    keywords: ['json', '格式化', '压缩', '校验'],
    order: 1,
    groupId: 'data',
    groupName: '数据解析',
    groupOrder: 1,
    defaultFavorite: true,
    component: JsonTool
  },
  {
    id: 'color',
    name: '颜色工具',
    icon: 'C',
    keywords: ['颜色', '色值', '渐变', '对比度', 'hex', 'rgb', 'hsl'],
    order: 2,
    groupId: 'utility',
    groupName: '实用工具',
    groupOrder: 3,
    component: ColorTool
  },
  {
    id: 'timestamp',
    name: '时间戳工具',
    icon: 'T',
    keywords: ['时间戳', '日期', 'utc', '毫秒', '秒'],
    order: 3,
    groupId: 'utility',
    groupName: '实用工具',
    groupOrder: 3,
    component: TimestampTool
  },
  {
    id: 'codec',
    name: '编码解码工具',
    icon: 'E',
    keywords: ['编码', '解码', 'url', 'base64', 'html entity', 'unicode'],
    order: 4,
    groupId: 'text',
    groupName: '文本处理',
    groupOrder: 2,
    defaultFavorite: true,
    component: CodecTool
  },
  {
    id: 'regex',
    name: '正则工具',
    icon: 'R',
    keywords: ['正则', 'regex', '匹配', '替换', '分组'],
    order: 5,
    groupId: 'text',
    groupName: '文本处理',
    groupOrder: 2,
    defaultFavorite: true,
    component: RegexTool
  },
  {
    id: 'url',
    name: 'URL 工具',
    icon: 'U',
    keywords: ['url', 'query', '参数', '链接', '解析'],
    order: 6,
    groupId: 'data',
    groupName: '数据解析',
    groupOrder: 1,
    defaultFavorite: true,
    component: UrlTool
  },
  {
    id: 'jwt',
    name: 'JWT 工具',
    icon: 'J',
    keywords: ['jwt', 'token', 'payload', 'header', 'exp'],
    order: 7,
    groupId: 'data',
    groupName: '数据解析',
    groupOrder: 1,
    component: JwtTool
  }
]

export const toolRegistryMap = new Map(toolRegistry.map((tool) => [tool.id, tool]))
