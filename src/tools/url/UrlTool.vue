<script setup lang="ts">
import { NAlert, NButton, NCard, NInput, NSpace, NTag, NText } from 'naive-ui'
import { useUrlTool } from '@/tools/url/composables/useUrlTool'

const {
  sourceUrl,
  protocol,
  host,
  pathname,
  hash,
  queryItems,
  outputUrl,
  error,
  parseInput,
  buildOutput,
  addQueryItem,
  updateQueryItem,
  deleteQueryItem,
  reset
} = useUrlTool()
</script>

<template>
  <n-card :bordered="false" class="url-tool">
    <div class="url-tool__hero">
      <div>
        <n-text class="url-tool__title" strong>URL 工具</n-text>
        <n-text depth="3" class="url-tool__subtitle">URL 解析、Query 编辑与回组装</n-text>
      </div>
      <n-tag round>URL</n-tag>
    </div>

    <n-space vertical :size="10">
      <n-input
        v-model:value="sourceUrl"
        type="textarea"
        :autosize="{ minRows: 3, maxRows: 5 }"
        placeholder="输入完整 URL（含协议）"
        data-testid="url-input"
      />

      <n-space :size="8" wrap>
        <n-button type="primary" @click="parseInput" data-testid="url-parse">解析</n-button>
        <n-button @click="buildOutput" data-testid="url-build">构建</n-button>
        <n-button quaternary @click="reset">清空</n-button>
      </n-space>

      <n-alert v-if="error" type="error" title="处理失败" :content="error" />

      <n-space vertical :size="8">
        <n-space :size="8" wrap>
          <n-input v-model:value="protocol" placeholder="协议" style="width: 120px" />
          <n-input v-model:value="host" placeholder="Host" style="min-width: 260px" data-testid="url-host" />
          <n-input v-model:value="pathname" placeholder="路径" style="min-width: 220px" />
          <n-input v-model:value="hash" placeholder="Hash" style="min-width: 180px" />
        </n-space>

        <n-text depth="3">Query 参数</n-text>

        <div v-for="(item, index) in queryItems" :key="`${index}-${item.key}`" class="url-tool__query-row">
          <n-input
            :value="item.key"
            placeholder="key"
            @update:value="(value) => updateQueryItem(index, 'key', value)"
          />
          <n-input
            :value="item.value"
            placeholder="value"
            @update:value="(value) => updateQueryItem(index, 'value', value)"
          />
          <n-button quaternary @click="deleteQueryItem(index)">删除</n-button>
        </div>

        <n-button size="small" @click="addQueryItem">新增参数</n-button>
      </n-space>

      <n-input
        :value="outputUrl"
        type="textarea"
        :autosize="{ minRows: 3, maxRows: 6 }"
        readonly
        placeholder="构建后的 URL"
        data-testid="url-output"
      />
    </n-space>
  </n-card>
</template>

<style scoped>
.url-tool {
  border-radius: 20px;
  background: rgb(255 255 255 / 68%);
  border: 1px solid rgb(255 255 255 / 74%);
}

.url-tool__hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.url-tool__title {
  display: block;
  font-size: 20px;
  color: #0f172a;
}

.url-tool__subtitle {
  display: block;
  margin-top: 3px;
  font-size: 12px;
}

.url-tool__query-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
}

@media (max-width: 980px) {
  .url-tool__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .url-tool__query-row {
    grid-template-columns: 1fr;
  }
}
</style>
