# CodeEditor 组件文档

`CodeEditor` 是基于 CodeMirror 6 封装的可复用代码编辑器组件，面向本项目和后续其他项目复用。

## 目标

- 统一代码输入/展示体验（行号、代码字体、语法高亮、只读模式）。
- 支持多语言切换，并可继续扩展。
- 通过 `enhanced` 开关控制高级编辑能力（折叠、多光标、搜索）。
- 与 Vue `v-model` 自然集成。

## 当前支持语言

- `json`
- `javascript`
- `typescript`
- `html`
- `css`
- `markdown`

语言注册在 [`languages.ts`](./languages.ts) 中维护。

## 快速使用

```vue
<script setup lang="ts">
import { ref } from 'vue'
import CodeEditor from '@/components/code-editor/CodeEditor.vue'
import type { CodeLanguage } from '@/components/code-editor/types'

const code = ref('{\n  "hello": "world"\n}')
const language = ref<CodeLanguage>('json')
</script>

<template>
  <CodeEditor
    v-model="code"
    :language="language"
    :enhanced="true"
    :line-numbers="true"
    :word-wrap="false"
    :min-height="280"
  />
</template>
```

## Props

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `modelValue` | `string` | - | 编辑器内容（`v-model`） |
| `language` | `CodeLanguage` | - | 语法高亮语言 |
| `readonly` | `boolean` | `false` | 是否只读 |
| `minHeight` | `number` | `240` | 最小高度（px） |
| `maxHeight` | `number \| 'auto'` | `'auto'` | 最大高度（px）或不限制 |
| `enhanced` | `boolean` | `true` | 是否开启增强能力 |
| `lineNumbers` | `boolean` | `true` | 是否显示行号 |
| `wordWrap` | `boolean` | `false` | 是否自动换行 |
| `placeholder` | `string` | `''` | 空内容占位提示 |

## Emits

| 事件 | 参数 | 说明 |
|---|---|---|
| `update:modelValue` | `(value: string)` | 内容变更 |
| `focus` | `()` | 获取焦点 |
| `blur` | `()` | 失去焦点 |
| `selection-change` | `({ from, to, text })` | 选区变化 |

## 功能说明

### 基础能力（默认）

- 行号（可关闭）
- 代码高亮
- 括号匹配
- 自动缩进
- 撤销/重做历史
- 当前行高亮
- 双击选词（浏览器/编辑器默认行为）

### 增强能力（`enhanced=true`）

- 代码折叠
- 多光标与矩形选择
- 搜索/替换快捷能力（由 CodeMirror search 扩展提供）
- 选区匹配高亮

## 扩展指南

### 1) 新增语言

在 [`languages.ts`](./languages.ts) 中：

1. 安装对应 `@codemirror/lang-*` 包
2. 在 `codeLanguageOptions` 增加选项
3. 在 `resolveLanguageExtension` 增加 `case`

示例：新增 `yaml`

```bash
npm install @codemirror/lang-yaml
```

```ts
// languages.ts
import { yaml } from '@codemirror/lang-yaml'

export const codeLanguageOptions: CodeLanguageOption[] = [
  // ...
  { label: 'YAML', value: 'yaml' }
]

export function resolveLanguageExtension(language: CodeLanguage): Extension {
  switch (language) {
    // ...
    case 'yaml':
      return yaml()
    default:
      return json()
  }
}
```

### 2) 新增编辑能力

在 [`extensions.ts`](./extensions.ts) 中：

1. 引入对应扩展
2. 按需加入 `sharedExtensions` 或 `enhanced` 分支

示例：给增强模式增加“Tab/Shift+Tab 缩进选区”的快捷键

```ts
// extensions.ts
import { indentMore, indentLess } from '@codemirror/commands'
import { keymap } from '@codemirror/view'

if (options.enhanced) {
  sharedExtensions.push(
    keymap.of([
      { key: 'Tab', run: indentMore },
      { key: 'Shift-Tab', run: indentLess }
    ])
  )
}
```

示例：自定义搜索高亮阈值

```ts
import { highlightSelectionMatches } from '@codemirror/search'

sharedExtensions.push(highlightSelectionMatches({ minSelectionLength: 2 }))
```

### 3) 主题调整

在 [`theme.ts`](./theme.ts) 中统一调整：

- 语法色（`HighlightStyle`）
- 编辑器/行号区/焦点态样式（`EditorView.theme`）

示例：调整关键字颜色和焦点阴影

```ts
// theme.ts
const editorHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#7c3aed', fontWeight: '700' }
])

const glassEditorTheme = EditorView.theme({
  '&.cm-editor.cm-focused': {
    outline: 'none',
    boxShadow: '0 0 0 3px rgb(124 58 237 / 18%)'
  }
})
```

## 在 JSON 页中的使用

JSON 工具使用该组件作为输入/输出双编辑器，见：
[`JsonTool.vue`](../../tools/json/JsonTool.vue)
