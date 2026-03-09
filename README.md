# frontend-tools-utools

uTools 前端开发工具集插件。

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
- 时间戳工具
  - 秒/毫秒时间戳互转
  - 日期字符串解析
  - UTC/本地时间与相对时间展示
- 编码解码工具
  - URL encode/decode
  - Base64 encode/decode
  - HTML Entity encode/decode
  - Unicode 转义/反转义
- 正则工具
  - 正则匹配与分组结果展示
  - 替换预览
- URL 工具
  - URL 解析（protocol/host/path/query/hash）
  - Query 参数可视化编辑与回组装
- JWT 工具
  - Header/Payload 本地解析
  - `iat/nbf/exp` 时间字段解析
  - 过期/生效状态提示（不校验签名）

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
