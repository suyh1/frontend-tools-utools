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
  <n-card title="JSON 工具" :bordered="false" class="json-tool">
    <template #header-extra>
      <n-space align="center" :size="8">
        <n-text depth="3">缩进</n-text>
        <n-select v-model:value="indent" :options="indentOptions" size="small" style="width: 108px" />
      </n-space>
    </template>

    <n-space vertical :size="12">
      <n-flex :wrap="false" :size="12" class="json-tool__actions">
        <n-button type="primary" strong @click="runFormat" data-testid="json-format">格式化</n-button>
        <n-button @click="runMinify" data-testid="json-minify">压缩</n-button>
        <n-button @click="runValidate" data-testid="json-validate">校验</n-button>
        <n-button @click="handleCopy" data-testid="json-copy">复制结果</n-button>
        <n-button quaternary @click="reset" data-testid="json-clear">清空</n-button>
      </n-flex>

      <n-alert v-if="validated === true" type="success" title="JSON 校验通过" />

      <n-alert
        v-if="error"
        type="error"
        title="JSON 校验失败"
        :content="`${error.message}${error.line !== null && error.column !== null ? ` (Line ${error.line}, Col ${error.column})` : ''}`"
        data-testid="json-error"
      />

      <div class="json-tool__grid">
        <div class="json-tool__panel">
          <n-text depth="3">输入</n-text>
          <n-input
            v-model:value="input"
            type="textarea"
            placeholder="粘贴 JSON 文本"
            :autosize="{ minRows: 12, maxRows: 26 }"
          />
        </div>
        <div class="json-tool__panel">
          <n-flex justify="space-between" align="center">
            <n-text depth="3">输出</n-text>
            <n-tag size="small" round>只读</n-tag>
          </n-flex>
          <n-input
            v-model:value="output"
            type="textarea"
            placeholder="格式化/压缩结果"
            :autosize="{ minRows: 12, maxRows: 26 }"
            readonly
          />
        </div>
      </div>
    </n-space>
  </n-card>
</template>

<style scoped>
.json-tool {
  border-radius: 14px;
  background-color: rgb(255 255 255 / 92%);
}

.json-tool__actions {
  overflow-x: auto;
  padding-bottom: 2px;
}

.json-tool__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.json-tool__panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (max-width: 900px) {
  .json-tool__grid {
    grid-template-columns: 1fr;
  }
}
</style>
