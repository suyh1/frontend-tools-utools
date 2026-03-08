# AGENTS.md

## Project Rules

- Frontend stack must remain: `Vue3 + Pinia + TypeScript`.
- Use Composition API (`<script setup lang="ts">`) for all new Vue modules.
- UI components should use `Naive UI` first; avoid mixing multiple UI libraries.
- New tools must be registered via `src/tools/registry.ts`.

## Boundaries

- Keep `public/preload/services.js` in JavaScript unless explicitly approved.
- Do not couple tool logic directly into `ToolShell`; put tool-specific code under `src/tools/<tool-id>`.
- Shared reusable logic goes to `src/composables`.

## Quality Gates

- Run `npm run test` before claiming completion.
- Run `npm run build` before claiming completion.
- Keep tests for tool utilities in `src/tools/**/utils/*.spec.ts`.

## Adding New Tool (Checklist)

1. Create `src/tools/<tool-id>/` module (`types`, `utils`, `composables`, `Tool.vue`).
2. Add/extend utility tests first, then implementation.
3. Register the tool in `src/tools/registry.ts`.
4. Verify both `npm run test` and `npm run build` pass.
