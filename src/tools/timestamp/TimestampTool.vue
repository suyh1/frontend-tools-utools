<script setup lang="ts">
import { NAlert, NButton, NCard, NGrid, NGridItem, NInput, NSpace, NText } from 'naive-ui'
import { useTimestampTool } from '@/tools/timestamp/composables/useTimestampTool'

const { input, result, sourceLabel, error, runConvert, setNowSeconds, setNowMilliseconds, reset } = useTimestampTool()
</script>

<template>
  <n-card :bordered="false" class="timestamp-tool">
    <div class="timestamp-tool__hero">
      <n-text class="timestamp-tool__title" strong>时间戳工具</n-text>
    </div>

    <n-space vertical :size="10">
      <n-input
        v-model:value="input"
        placeholder="输入秒/毫秒时间戳或日期字符串"
        data-testid="timestamp-input"
      />

      <n-space :size="8" wrap>
        <n-button type="primary" @click="runConvert" data-testid="timestamp-convert">转换</n-button>
        <n-button @click="setNowSeconds">当前秒时间戳</n-button>
        <n-button @click="setNowMilliseconds">当前毫秒时间戳</n-button>
        <n-button quaternary @click="reset">清空</n-button>
      </n-space>

      <n-alert v-if="error" type="error" title="转换失败" :content="error" />

      <div v-if="result" class="timestamp-tool__result">
        <n-grid :cols="2" :x-gap="10" :y-gap="10">
          <n-grid-item>
            <n-text depth="3">来源类型</n-text>
            <n-input :value="sourceLabel" readonly />
          </n-grid-item>
          <n-grid-item>
            <n-text depth="3">秒时间戳</n-text>
            <n-input :value="String(result.timestampSec)" readonly />
          </n-grid-item>
          <n-grid-item>
            <n-text depth="3">毫秒时间戳</n-text>
            <n-input :value="String(result.timestampMs)" readonly />
          </n-grid-item>
          <n-grid-item>
            <n-text depth="3">本地时间</n-text>
            <n-input :value="result.localText" readonly />
          </n-grid-item>
        </n-grid>

        <n-space vertical :size="4" class="timestamp-tool__utc-block">
          <n-text depth="3">UTC</n-text>
          <n-text data-testid="timestamp-utc-text">{{ result.isoUtc }}</n-text>
          <n-text depth="3">相对时间：{{ result.relativeText }}</n-text>
        </n-space>
      </div>
    </n-space>
  </n-card>
</template>

<style scoped>
.timestamp-tool {
  border-radius: 20px;
  background: rgb(255 255 255 / 68%);
  border: 1px solid rgb(255 255 255 / 74%);
}

.timestamp-tool__hero {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.timestamp-tool__title {
  display: block;
  font-size: 16px;
  color: #0f172a;
}

.timestamp-tool__subtitle {
  display: block;
  margin-top: 3px;
  font-size: 12px;
}

.timestamp-tool__result {
  margin-top: 4px;
  padding: 10px;
  border-radius: 14px;
  border: 1px solid rgb(255 255 255 / 74%);
  background: rgb(255 255 255 / 62%);
}

.timestamp-tool__utc-block {
  margin-top: 8px;
}

@media (max-width: 980px) {
  .timestamp-tool__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
