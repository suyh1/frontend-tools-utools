<script setup lang="ts">
import { NAlert, NButton, NCard, NFlex, NInput, NSelect, NSpace, NTag, NText } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { useJsonTool } from '@/tools/json/composables/useJsonTool'

const {
  indent,
  input,
  output,
  error,
  validated,
  runFormat,
  runMinify,
  runValidate,
  reset,
  copyOutput
} = useJsonTool()

const indentOptions: SelectOption[] = [
  { label: '2 空格', value: 2 },
  { label: '4 空格', value: 4 }
]

async function handleCopy() {
  const copied = await copyOutput()
  const notify = window.utools?.showNotification ?? ((message: string) => console.info(message))
  if (!copied) {
    notify('复制失败')
    return
  }
  notify('复制成功')
}
</script>

<template>
  <n-card :bordered="false" class="json-tool">
    <div class="json-tool__hero">
      <div>
        <n-text class="json-tool__title" strong>JSON 工具</n-text>
        <n-text depth="3" class="json-tool__subtitle">格式化、压缩、校验一体化工作区</n-text>
      </div>
      <n-tag class="json-tool__status" round>Structured Data</n-tag>
    </div>

    <div class="json-tool__toolbar">
      <n-space :size="8" class="json-tool__toolbar-main">
        <n-button type="primary" strong @click="runFormat" data-testid="json-format">格式化</n-button>
        <n-button @click="runMinify" data-testid="json-minify">压缩</n-button>
        <n-button @click="runValidate" data-testid="json-validate">校验</n-button>
      </n-space>

      <n-space :size="8" class="json-tool__toolbar-side" align="center">
        <n-text depth="3">缩进</n-text>
        <n-select v-model:value="indent" :options="indentOptions" size="small" style="width: 108px" />
        <n-button @click="handleCopy" data-testid="json-copy">复制结果</n-button>
        <n-button quaternary @click="reset" data-testid="json-clear">清空</n-button>
      </n-space>
    </div>

    <n-alert v-if="validated === true" type="success" title="JSON 校验通过" class="json-tool__alert" />

    <n-alert
      v-if="error"
      type="error"
      title="JSON 校验失败"
      :content="`${error.message}${error.line !== null && error.column !== null ? ` (Line ${error.line}, Col ${error.column})` : ''}`"
      data-testid="json-error"
      class="json-tool__alert"
    />

    <div class="json-tool__workspace">
      <section class="json-panel">
        <div class="json-panel__header">
          <n-text depth="3">输入</n-text>
          <n-tag size="small" round>Editable</n-tag>
        </div>

        <n-input
          v-model:value="input"
          type="textarea"
          placeholder="粘贴 JSON 文本"
          :autosize="{ minRows: 14, maxRows: 26 }"
          class="json-panel__textarea"
        />
      </section>

      <section class="json-panel">
        <div class="json-panel__header">
          <n-text depth="3">输出</n-text>
          <n-tag size="small" round>只读</n-tag>
        </div>

        <n-input
          v-model:value="output"
          type="textarea"
          placeholder="格式化/压缩结果"
          :autosize="{ minRows: 14, maxRows: 26 }"
          readonly
          class="json-panel__textarea"
        />
      </section>
    </div>
  </n-card>
</template>

<style scoped>
.json-tool {
  border-radius: 20px;
  background: rgb(255 255 255 / 68%);
  border: 1px solid rgb(255 255 255 / 74%);
  box-shadow: 0 22px 44px rgb(15 23 42 / 9%);
  backdrop-filter: blur(14px);
}

.json-tool__hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.json-tool__title {
  display: block;
  font-size: 20px;
  color: #0f172a;
}

.json-tool__subtitle {
  display: block;
  margin-top: 3px;
  font-size: 12px;
}

.json-tool__status {
  background: linear-gradient(120deg, rgb(36 123 255 / 16%), rgb(0 216 210 / 16%));
  border: 1px solid rgb(255 255 255 / 78%);
}

.json-tool__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.json-tool__toolbar-main {
  flex-wrap: wrap;
}

.json-tool__toolbar-side {
  flex-wrap: wrap;
}

.json-tool__alert {
  margin-bottom: 10px;
}

.json-tool__workspace {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.json-panel {
  padding: 10px;
  border-radius: 16px;
  border: 1px solid rgb(255 255 255 / 74%);
  background: rgb(255 255 255 / 62%);
}

.json-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.json-panel__textarea {
  --n-color: rgb(255 255 255 / 78%);
  --n-color-focus: rgb(255 255 255 / 92%);
  --n-border-hover: rgb(36 123 255 / 42%);
  --n-border-focus: rgb(36 123 255 / 52%);
  --n-box-shadow-focus: 0 0 0 3px rgb(36 123 255 / 14%);
}

@media (max-width: 980px) {
  .json-tool__workspace {
    grid-template-columns: 1fr;
  }

  .json-tool__hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .json-tool__status {
    align-self: flex-start;
  }
}
</style>
