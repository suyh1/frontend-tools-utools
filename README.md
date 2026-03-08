# frontend-tools-utools

uTools 前端开发工具集插件（首版）。

## 当前能力

- 单入口 + 应用内 Tab 切换
- JSON 工具
  - 格式化（2/4 缩进）
  - 压缩（Minify）
  - 校验（错误提示含位置信息）
- 颜色工具
  - HEX / RGB / HSL 转换
  - 调色板（基础色 + 最近颜色）
  - 渐变生成器（2~5 色标）
  - WCAG 对比度检查（AA / AAA）

## 技术栈

- Vue 3 + Composition API
- Pinia
- TypeScript
- Naive UI
- Vitest + Vue Test Utils

## 开发命令

```bash
npm install
npm run dev
npm run test
npm run build
```

## 与 uTools 的关系

- 前端渲染层已改造为 TS 架构。
- `public/preload/services.js` 保持 JS，不做 TS 化（按约束保留）。
- `public/plugin.json` 使用单一入口 `main`。

## 目录约定

- `src/app`：应用壳层（ToolShell、进入动作映射）
- `src/stores`：全局状态（activeTool/recent/preferences）
- `src/tools`：工具模块与注册中心
- `src/composables`：通用组合逻辑（如剪贴板）
- `src/types`：全局类型声明（uTools/preload）
