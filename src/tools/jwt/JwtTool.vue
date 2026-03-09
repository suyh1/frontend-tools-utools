<script setup lang="ts">
import { NAlert, NButton, NCard, NInput, NSpace, NTag, NText } from 'naive-ui'
import { useJwtTool } from '@/tools/jwt/composables/useJwtTool'

const { token, headerText, payloadText, signature, timeRows, status, error, runParse, reset } = useJwtTool()
</script>

<template>
  <n-card :bordered="false" class="jwt-tool">
    <div class="jwt-tool__hero">
      <div>
        <n-text class="jwt-tool__title" strong>JWT 工具</n-text>
        <n-text depth="3" class="jwt-tool__subtitle">本地解析 Header/Payload（不校验签名）</n-text>
      </div>
      <n-tag round>JWT</n-tag>
    </div>

    <n-space vertical :size="10">
      <n-input
        v-model:value="token"
        type="textarea"
        :autosize="{ minRows: 4, maxRows: 8 }"
        placeholder="粘贴 JWT Token"
        data-testid="jwt-input"
      />

      <n-space :size="8" wrap>
        <n-button type="primary" @click="runParse" data-testid="jwt-parse">解析</n-button>
        <n-button quaternary @click="reset">清空</n-button>
      </n-space>

      <n-alert v-if="error" type="error" title="解析失败" :content="error" />
      <n-alert v-else type="info" title="说明" content="仅进行本地解码展示，不做签名合法性校验" />

      <div v-if="payloadText" class="jwt-tool__status-row">
        <n-tag :type="status.expired ? 'error' : 'success'">{{ status.expired ? '已过期' : '未过期' }}</n-tag>
        <n-tag :type="status.notYetValid ? 'warning' : 'success'">{{ status.notYetValid ? '未到生效时间' : '已生效' }}</n-tag>
      </div>

      <div v-if="headerText" class="jwt-tool__json-block">
        <n-text depth="3">Header</n-text>
        <pre class="jwt-tool__json">{{ headerText }}</pre>
      </div>

      <div v-if="payloadText" class="jwt-tool__json-block">
        <n-text depth="3">Payload</n-text>
        <pre class="jwt-tool__json" data-testid="jwt-payload-preview">{{ payloadText }}</pre>
      </div>

      <div v-if="signature" class="jwt-tool__json-block">
        <n-text depth="3">Signature</n-text>
        <n-input :value="signature" readonly />
      </div>

      <div v-if="timeRows.length" class="jwt-tool__json-block">
        <n-text depth="3">时间字段</n-text>
        <div v-for="row in timeRows" :key="row.key" class="jwt-tool__time-row">
          <n-text strong>{{ row.key }}</n-text>
          <n-text depth="3">{{ row.epochSeconds }} | {{ row.isoUtc }} | {{ row.relativeText }}</n-text>
        </div>
      </div>
    </n-space>
  </n-card>
</template>

<style scoped>
.jwt-tool {
  border-radius: 20px;
  background: rgb(255 255 255 / 68%);
  border: 1px solid rgb(255 255 255 / 74%);
}

.jwt-tool__hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.jwt-tool__title {
  display: block;
  font-size: 20px;
  color: #0f172a;
}

.jwt-tool__subtitle {
  display: block;
  margin-top: 3px;
  font-size: 12px;
}

.jwt-tool__status-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.jwt-tool__json-block {
  padding: 10px;
  border-radius: 12px;
  border: 1px solid rgb(255 255 255 / 74%);
  background: rgb(255 255 255 / 62%);
}

.jwt-tool__json {
  margin: 6px 0 0;
  padding: 8px;
  border-radius: 8px;
  background: rgb(15 23 42 / 6%);
  white-space: pre-wrap;
  word-break: break-word;
}

.jwt-tool__time-row + .jwt-tool__time-row {
  margin-top: 6px;
}

@media (max-width: 980px) {
  .jwt-tool__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
