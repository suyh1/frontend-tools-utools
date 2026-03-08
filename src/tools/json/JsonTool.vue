<script setup lang="ts">
import { computed, ref } from 'vue'
import { NAlert, NButton, NCard, NFlex, NSelect, NSpace, NTag, NText } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import CodeEditor from '@/components/code-editor/CodeEditor.vue'
import { codeLanguageOptions } from '@/components/code-editor/languages'
import type { CodeLanguage } from '@/components/code-editor/types'
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

const selectedLanguage = ref<CodeLanguage>('json')

const indentOptions: SelectOption[] = [
  { label: '2 空格', value: 2 },
  { label: '4 空格', value: 4 }
]

const languageOptions = computed<SelectOption[]>(() =>
  codeLanguageOptions.map((item) => ({
    label: item.label,
    value: item.value
  }))
)

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
        <n-text depth="3" class="json-tool__subtitle">多语言代码编辑器 + JSON 格式化、压缩、校验</n-text>
      </div>
      <n-tag class="json-tool__status" round>Code Workspace</n-tag>
    </div>

    <div class="json-tool__toolbar">
      <n-space :size="8" class="json-tool__toolbar-main">
        <n-button type="primary" strong @click="runFormat" data-testid="json-format">格式化</n-button>
        <n-button @click="runMinify" data-testid="json-minify">压缩</n-button>
        <n-button @click="runValidate" data-testid="json-validate">校验</n-button>
      </n-space>

      <n-space :size="8" class="json-tool__toolbar-side" align="center">
        <n-text depth="3">语言</n-text>
        <n-select
          v-model:value="selectedLanguage"
          :options="languageOptions"
          size="small"
          style="width: 148px"
          data-testid="json-language"
        />
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

        <CodeEditor
          v-model="input"
          :language="selectedLanguage"
          :enhanced="true"
          :min-height="340"
          placeholder="粘贴或输入代码"
        />
      </section>

      <section class="json-panel">
        <div class="json-panel__header">
          <n-text depth="3">输出</n-text>
          <n-tag size="small" round>只读</n-tag>
        </div>

        <CodeEditor
          v-model="output"
          :language="selectedLanguage"
          :readonly="true"
          :enhanced="true"
          :min-height="340"
          placeholder="格式化/压缩结果"
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

.json-tool__toolbar-main,
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
