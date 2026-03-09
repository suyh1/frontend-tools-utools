# 路线 A 扩展工具设计文档

**日期：** 2026-03-09  
**状态：** 已确认  
**范围：** 时间戳、编码解码、正则测试、URL 工具、JWT 解析

---

## 1. 目标与约束

### 1.1 目标
- 在现有 JSON/颜色工具基础上扩展 5 个高频前端工具。
- 保持当前可扩展注册式架构，不修改插件单入口模式。
- 保证新增工具全部本地计算，无网络依赖。

### 1.2 约束
- 技术栈保持 `Vue3 + Pinia + TypeScript + Naive UI`。
- 每个工具独立放在 `src/tools/<tool-id>`，禁止把工具逻辑耦合到 `ToolShell`。
- 新工具必须通过 `src/tools/registry.ts` 注册。
- `public/preload/services.js` 不改为 TypeScript。

---

## 2. 总体方案

采用“统一壳层 + 独立工具模块 + 工具内组合式状态”的延展方案：

- `ToolShell` 继续只负责导航和工具切换。
- 5 个新工具模块分别维护 `types/utils/composables/Tool.vue`。
- 核心算法沉淀在 `utils`，并优先通过 `utils/*.spec.ts` 测试驱动开发。

此方案能快速交付高频能力，同时保持后续扩展成本可控。

---

## 3. 工具能力定义

### 3.1 时间戳工具（timestamp）
- 秒/毫秒时间戳与日期字符串互转。
- 本地时间与 UTC 展示。
- 相对时间（距现在）展示。
- 异常输入给出明确错误提示。

### 3.2 编码解码工具（codec）
- URL encode/decode。
- Base64 encode/decode。
- HTML Entity encode/decode。
- Unicode 转义与反转义。

### 3.3 正则测试工具（regex）
- 输入表达式与 flags 后运行匹配。
- 展示每个匹配结果、索引、分组信息。
- 提供替换预览（replace）结果。
- 非法表达式返回错误信息。

### 3.4 URL 工具（url）
- 解析 URL（protocol/host/path/query/hash）。
- Query 参数表格化编辑。
- 从结构化输入重新构建 URL。
- 非法 URL 明确提示。

### 3.5 JWT 解析工具（jwt）
- 本地解析 header/payload。
- 展示 `iat/nbf/exp` 对应时间与状态。
- 提示“仅解析，不校验签名”。
- 非法 token 给出可读错误。

---

## 4. 交互与状态

- 每个工具 UI 统一采用 `Naive UI` 组件。
- 输入/输出尽量使用已有 `CodeEditor` 组件统一编辑体验。
- 工具状态在各自 composable 内闭环，不引入跨工具全局状态。
- copy 行为复用 `src/composables/useClipboard`。

---

## 5. 错误处理策略

- 所有 `utils` 返回结构化结果：`ok + data/error`。
- 工具界面通过 `NAlert` 显示错误，不抛出未捕获异常。
- 对解析类输入（Regex/URL/JWT/Base64）使用 `try/catch` 包装。

---

## 6. 测试与验收

- 每个新工具都新增 `utils/*.spec.ts`，覆盖主路径和异常路径。
- 每个工具新增 `Tool.spec.ts` 做基础渲染/关键行为校验。
- 验收门禁：`npm run test` 与 `npm run build` 全通过。

---

## 7. 交付结果

- 新增 5 个前端高频工具并注册到主界面。
- 保持现有 JSON/颜色工具不回归。
- 产出完整测试与可持续扩展目录结构。
