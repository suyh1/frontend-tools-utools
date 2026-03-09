# 路线 A 扩展工具 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在现有 JSON/颜色工具基础上新增时间戳、编码解码、正则测试、URL、JWT 五个本地工具并完成注册、测试和构建验证。

**Architecture:** 延续现有注册式工具架构，新增每个工具的 `types + utils + composables + Tool.vue` 模块，并让核心行为通过 `utils` 纯函数承载。UI 层统一使用 Naive UI 与现有 CodeEditor，工具壳层仅负责导航与装配。所有新增能力默认离线执行，不新增远程依赖。

**Tech Stack:** Vue 3 (`<script setup lang="ts">`), Pinia, TypeScript, Naive UI, Vitest, @vue/test-utils.

---

### Task 1: 扩展工具注册与目录骨架

**Files:**
- Modify: `src/tools/registry.ts`
- Create: `src/tools/timestamp/`
- Create: `src/tools/codec/`
- Create: `src/tools/regex/`
- Create: `src/tools/url/`
- Create: `src/tools/jwt/`

**Step 1: Write the failing test**

更新/新增 `src/app/ToolShell.spec.ts`，断言注册表包含新工具 ID。

```ts
expect(toolRegistry.map((t) => t.id)).toEqual(['json', 'color', 'timestamp', 'codec', 'regex', 'url', 'jwt'])
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/app/ToolShell.spec.ts`
Expected: FAIL（注册表尚未包含新工具）。

**Step 3: Write minimal implementation**

- 在 `registry.ts` 新增 5 个异步组件声明和注册项。
- 为 5 个工具创建目录骨架文件（空实现占位）。

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/app/ToolShell.spec.ts`
Expected: PASS。

**Step 5: Commit**

```bash
git add src/tools/registry.ts src/app/ToolShell.spec.ts src/tools/timestamp src/tools/codec src/tools/regex src/tools/url src/tools/jwt
git commit -m "feat: 新增路线A工具模块骨架与注册表"
```

---

### Task 2: 时间戳工具 utils 与单测（TDD）

**Files:**
- Create: `src/tools/timestamp/types.ts`
- Create: `src/tools/timestamp/utils/timestamp.ts`
- Create: `src/tools/timestamp/utils/timestamp.spec.ts`

**Step 1: Write the failing test**

编写用例覆盖：
- 秒/毫秒时间戳解析
- 日期字符串转时间戳
- 本地/UTC 格式化
- 相对时间文案
- 非法输入报错

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/tools/timestamp/utils/timestamp.spec.ts`
Expected: FAIL（实现缺失）。

**Step 3: Write minimal implementation**

实现纯函数：`parseDateInput`、`formatTimestampView`、`toRelativeLabel`。

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/tools/timestamp/utils/timestamp.spec.ts`
Expected: PASS。

**Step 5: Commit**

```bash
git add src/tools/timestamp/types.ts src/tools/timestamp/utils/timestamp.ts src/tools/timestamp/utils/timestamp.spec.ts
git commit -m "feat: 完成时间戳工具核心算法与测试"
```

---

### Task 3: 编码解码工具 utils 与单测（TDD）

**Files:**
- Create: `src/tools/codec/types.ts`
- Create: `src/tools/codec/utils/codec.ts`
- Create: `src/tools/codec/utils/codec.spec.ts`

**Step 1: Write the failing test**

覆盖 URL/Base64/HTML Entity/Unicode 的 encode/decode 成功与失败路径。

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/tools/codec/utils/codec.spec.ts`
Expected: FAIL。

**Step 3: Write minimal implementation**

实现：`runCodecTransform(input, mode)`，并返回统一 `ok/data/error` 结构。

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/tools/codec/utils/codec.spec.ts`
Expected: PASS。

**Step 5: Commit**

```bash
git add src/tools/codec/types.ts src/tools/codec/utils/codec.ts src/tools/codec/utils/codec.spec.ts
git commit -m "feat: 完成编码解码工具核心算法与测试"
```

---

### Task 4: 正则工具 utils 与单测（TDD）

**Files:**
- Create: `src/tools/regex/types.ts`
- Create: `src/tools/regex/utils/regex.ts`
- Create: `src/tools/regex/utils/regex.spec.ts`

**Step 1: Write the failing test**

覆盖：
- 多匹配结果
- 分组提取
- replace 预览
- 非法表达式错误

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/tools/regex/utils/regex.spec.ts`
Expected: FAIL。

**Step 3: Write minimal implementation**

实现：`analyzeRegex` 与 `previewRegexReplace`。

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/tools/regex/utils/regex.spec.ts`
Expected: PASS。

**Step 5: Commit**

```bash
git add src/tools/regex/types.ts src/tools/regex/utils/regex.ts src/tools/regex/utils/regex.spec.ts
git commit -m "feat: 完成正则工具核心算法与测试"
```

---

### Task 5: URL 工具 utils 与单测（TDD）

**Files:**
- Create: `src/tools/url/types.ts`
- Create: `src/tools/url/utils/url.ts`
- Create: `src/tools/url/utils/url.spec.ts`

**Step 1: Write the failing test**

覆盖 URL 解析、Query 键值编辑后回组装、非法 URL 报错。

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/tools/url/utils/url.spec.ts`
Expected: FAIL。

**Step 3: Write minimal implementation**

实现：`parseUrl`、`buildUrlFromParts`、`upsertQueryItem`/`removeQueryItem`。

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/tools/url/utils/url.spec.ts`
Expected: PASS。

**Step 5: Commit**

```bash
git add src/tools/url/types.ts src/tools/url/utils/url.ts src/tools/url/utils/url.spec.ts
git commit -m "feat: 完成URL工具核心算法与测试"
```

---

### Task 6: JWT 工具 utils 与单测（TDD）

**Files:**
- Create: `src/tools/jwt/types.ts`
- Create: `src/tools/jwt/utils/jwt.ts`
- Create: `src/tools/jwt/utils/jwt.spec.ts`

**Step 1: Write the failing test**

覆盖合法 JWT 的 header/payload 解析、时间字段读取、非法 token 错误。

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/tools/jwt/utils/jwt.spec.ts`
Expected: FAIL。

**Step 3: Write minimal implementation**

实现：`parseJwtToken`、`resolveJwtTimeFields`，并明确“仅解析不校验签名”。

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/tools/jwt/utils/jwt.spec.ts`
Expected: PASS。

**Step 5: Commit**

```bash
git add src/tools/jwt/types.ts src/tools/jwt/utils/jwt.ts src/tools/jwt/utils/jwt.spec.ts
git commit -m "feat: 完成JWT工具核心算法与测试"
```

---

### Task 7: 五个工具 composable + UI 组件

**Files:**
- Create: `src/tools/timestamp/composables/useTimestampTool.ts`
- Create: `src/tools/timestamp/TimestampTool.vue`
- Create: `src/tools/codec/composables/useCodecTool.ts`
- Create: `src/tools/codec/CodecTool.vue`
- Create: `src/tools/regex/composables/useRegexTool.ts`
- Create: `src/tools/regex/RegexTool.vue`
- Create: `src/tools/url/composables/useUrlTool.ts`
- Create: `src/tools/url/UrlTool.vue`
- Create: `src/tools/jwt/composables/useJwtTool.ts`
- Create: `src/tools/jwt/JwtTool.vue`

**Step 1: Write the failing test**

分别新增组件测试：
- `src/tools/timestamp/TimestampTool.spec.ts`
- `src/tools/codec/CodecTool.spec.ts`
- `src/tools/regex/RegexTool.spec.ts`
- `src/tools/url/UrlTool.spec.ts`
- `src/tools/jwt/JwtTool.spec.ts`

每个测试至少覆盖：渲染标题、核心控件存在、关键动作可触发。

**Step 2: Run test to verify it fails**

Run:
- `npm run test -- src/tools/timestamp/TimestampTool.spec.ts`
- `npm run test -- src/tools/codec/CodecTool.spec.ts`
- `npm run test -- src/tools/regex/RegexTool.spec.ts`
- `npm run test -- src/tools/url/UrlTool.spec.ts`
- `npm run test -- src/tools/jwt/JwtTool.spec.ts`

Expected: FAIL。

**Step 3: Write minimal implementation**

实现 5 个 composable + Tool.vue，绑定 utils，展示结果与错误提示。

**Step 4: Run test to verify it passes**

按 Step 2 同命令逐一通过。

**Step 5: Commit**

```bash
git add src/tools/timestamp src/tools/codec src/tools/regex src/tools/url src/tools/jwt
git commit -m "feat: 完成路线A五个工具界面与交互"
```

---

### Task 8: 集成回归与质量门禁

**Files:**
- Modify: `README.md`（补充新增工具能力）

**Step 1: Write the failing test**

在 `src/app/ToolShell.spec.ts` 追加断言，验证新增工具名称可见。

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/app/ToolShell.spec.ts`
Expected: FAIL。

**Step 3: Write minimal implementation**

更新 registry 信息（名称/关键词/排序）与 README 功能说明。

**Step 4: Run test to verify it passes**

Run:
- `npm run test -- src/app/ToolShell.spec.ts`
- `npm run test`
- `npm run build`

Expected: 全通过。

**Step 5: Commit**

```bash
git add src/app/ToolShell.spec.ts src/tools/registry.ts README.md
git commit -m "docs: 更新扩展工具说明并完成全量验证"
```
