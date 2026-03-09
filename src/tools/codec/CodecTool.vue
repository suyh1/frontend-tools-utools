<script setup lang="ts">
import { NAlert, NButton, NCard, NInput, NSelect, NSpace, NTag, NText } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { useCodecTool } from '@/tools/codec/composables/useCodecTool'

const { mode, input, output, error, runTransform, reset } = useCodecTool()

const modeOptions: SelectOption[] = [
  { label: 'URL Encode', value: 'url-encode' },
  { label: 'URL Decode', value: 'url-decode' },
  { label: 'Base64 Encode', value: 'base64-encode' },
  { label: 'Base64 Decode', value: 'base64-decode' },
  { label: 'HTML Entity Encode', value: 'html-encode' },
  { label: 'HTML Entity Decode', value: 'html-decode' },
  { label: 'Unicode Escape', value: 'unicode-escape' },
  { label: 'Unicode Unescape', value: 'unicode-unescape' }
]
</script>

<template>
  <n-card :bordered="false" class="codec-tool">
    <div class="codec-tool__hero">
      <div>
        <n-text class="codec-tool__title" strong>编码解码工具</n-text>
        <n-text depth="3" class="codec-tool__subtitle">URL、Base64、HTML Entity、Unicode 一键转换</n-text>
      </div>
      <n-tag round>Codec</n-tag>
    </div>

    <n-space vertical :size="10">
      <n-space :size="8" align="center" wrap>
        <n-text depth="3">模式</n-text>
        <n-select v-model:value="mode" :options="modeOptions" style="width: 230px" data-testid="codec-mode" />
        <n-button type="primary" @click="runTransform" data-testid="codec-run">执行转换</n-button>
        <n-button quaternary @click="reset">清空</n-button>
      </n-space>

      <n-input
        v-model:value="input"
        type="textarea"
        :autosize="{ minRows: 6, maxRows: 10 }"
        placeholder="输入待转换文本"
        data-testid="codec-input"
      />

      <n-alert v-if="error" type="error" title="转换失败" :content="error" />

      <n-input
        :value="output"
        type="textarea"
        :autosize="{ minRows: 6, maxRows: 10 }"
        readonly
        placeholder="转换结果"
        data-testid="codec-output"
      />
    </n-space>
  </n-card>
</template>

<style scoped>
.codec-tool {
  border-radius: 20px;
  background: rgb(255 255 255 / 68%);
  border: 1px solid rgb(255 255 255 / 74%);
}

.codec-tool__hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.codec-tool__title {
  display: block;
  font-size: 20px;
  color: #0f172a;
}

.codec-tool__subtitle {
  display: block;
  margin-top: 3px;
  font-size: 12px;
}

@media (max-width: 980px) {
  .codec-tool__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
