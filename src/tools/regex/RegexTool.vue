<script setup lang="ts">
import { computed } from 'vue'
import { NAlert, NButton, NCard, NInput, NSpace, NTag, NText } from 'naive-ui'
import CodeEditor from '@/components/code-editor/CodeEditor.vue'
import { useRegexTool } from '@/tools/regex/composables/useRegexTool'
import { createRegexInputCodeValidator } from '@/tools/regex/utils/regex-editor-validator'

const { pattern, flags, input, replacement, matches, replaceOutput, error, runMatch, runReplace, reset } = useRegexTool()

const inputValidators = computed(() => [
  createRegexInputCodeValidator({
    pattern: pattern.value,
    flags: flags.value
  })
])
</script>

<template>
  <n-card :bordered="false" class="regex-tool">
    <div class="regex-tool__hero">
      <div>
        <n-text class="regex-tool__title" strong>正则工具</n-text>
        <n-text depth="3" class="regex-tool__subtitle">匹配分组分析与替换预览</n-text>
      </div>
      <n-tag round>Regex</n-tag>
    </div>

    <n-space vertical :size="10">
      <n-space :size="8" wrap>
        <n-input v-model:value="pattern" placeholder="正则表达式" style="min-width: 280px" data-testid="regex-pattern" />
        <n-input v-model:value="flags" placeholder="flags，如 gmi" style="width: 160px" data-testid="regex-flags" />
      </n-space>

      <CodeEditor
        v-model="input"
        language="markdown"
        :enhanced="true"
        :min-height="220"
        placeholder="输入待匹配文本"
        :validators="inputValidators"
        data-testid="regex-input-editor"
      />

      <n-space :size="8" wrap>
        <n-button type="primary" @click="runMatch" data-testid="regex-match">执行匹配</n-button>
        <n-button @click="runReplace" data-testid="regex-replace">预览替换</n-button>
        <n-button quaternary @click="reset">清空</n-button>
      </n-space>

      <n-alert v-if="error" type="error" title="执行失败" :content="error" />

      <n-text data-testid="regex-count">匹配数：{{ matches.length }}</n-text>

      <div v-if="matches.length" class="regex-tool__match-list">
        <div v-for="(match, index) in matches" :key="`${index}-${match.index}`" class="regex-tool__match-item">
          <n-text>#{{ index + 1 }} @{{ match.index }}: {{ match.value }}</n-text>
          <n-text depth="3">分组：{{ match.groups.join(' | ') || '-' }}</n-text>
        </div>
      </div>

      <n-input v-model:value="replacement" placeholder="替换模板，如 bar$1" />
      <CodeEditor
        v-model="replaceOutput"
        language="markdown"
        :readonly="true"
        :enhanced="true"
        :min-height="160"
        placeholder="替换结果预览"
        data-testid="regex-output-editor"
      />
    </n-space>
  </n-card>
</template>

<style scoped>
.regex-tool {
  border-radius: 20px;
  background: rgb(255 255 255 / 68%);
  border: 1px solid rgb(255 255 255 / 74%);
}

.regex-tool__hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.regex-tool__title {
  display: block;
  font-size: 20px;
  color: #0f172a;
}

.regex-tool__subtitle {
  display: block;
  margin-top: 3px;
  font-size: 12px;
}

.regex-tool__match-list {
  display: grid;
  gap: 8px;
}

.regex-tool__match-item {
  padding: 8px;
  border-radius: 10px;
  border: 1px solid rgb(255 255 255 / 74%);
  background: rgb(255 255 255 / 62%);
}

@media (max-width: 980px) {
  .regex-tool__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
