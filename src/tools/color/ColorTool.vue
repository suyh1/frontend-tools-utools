<script setup lang="ts">
import {
  NAlert,
  NButton,
  NCard,
  NFlex,
  NGrid,
  NGridItem,
  NInput,
  NInputNumber,
  NSlider,
  NSpace,
  NTag,
  NText
} from 'naive-ui'
import { useColorTool } from '@/tools/color/composables/useColorTool'

const {
  sourceInput,
  sourceInvalid,
  hexText,
  rgbText,
  hslText,
  recentColors,
  gradientAngle,
  gradientStops,
  gradientCss,
  foreground,
  background,
  contrastReport,
  updateSourceColor,
  addGradientStop,
  removeGradientStop,
  updateGradientStop,
  copyGradientCss,
  resetAll
} = useColorTool()

const basePalette = ['#FF5A5F', '#3A7AFE', '#00C2A8', '#FFC53D', '#8E59FF', '#121212']

async function handleCopyGradient() {
  const copied = await copyGradientCss()
  const notify = window.utools?.showNotification ?? ((message: string) => console.info(message))
  notify(copied ? '渐变 CSS 已复制' : '复制失败')
}
</script>

<template>
  <n-card title="颜色工具" :bordered="false" class="color-tool">
    <template #header-extra>
      <n-space :size="8">
        <n-button size="small" @click="handleCopyGradient" data-testid="color-copy-gradient">复制渐变 CSS</n-button>
        <n-button size="small" quaternary @click="resetAll" data-testid="color-reset">重置</n-button>
      </n-space>
    </template>

    <n-space vertical :size="14">
      <section>
        <n-text depth="3">输入颜色</n-text>
        <n-input
          v-model:value="sourceInput"
          placeholder="支持 #HEX / rgb() / hsl()"
          data-testid="color-source-input"
        />
        <n-alert v-if="sourceInvalid" type="error" title="颜色格式无效" style="margin-top: 8px" />
      </section>

      <n-grid :cols="3" :x-gap="10" :y-gap="10" class="color-tool__grid">
        <n-grid-item>
          <n-text depth="3">HEX</n-text>
          <n-input :value="hexText" readonly data-testid="color-hex" />
        </n-grid-item>
        <n-grid-item>
          <n-text depth="3">RGB</n-text>
          <n-input :value="rgbText" readonly data-testid="color-rgb" />
        </n-grid-item>
        <n-grid-item>
          <n-text depth="3">HSL</n-text>
          <n-input :value="hslText" readonly data-testid="color-hsl" />
        </n-grid-item>
      </n-grid>

      <section>
        <n-text depth="3">调色板</n-text>
        <n-flex :size="8" wrap>
          <n-button
            v-for="color in basePalette"
            :key="color"
            tertiary
            @click="updateSourceColor(color)"
            :style="{ border: '1px solid #d9d9d9' }"
          >
            <span class="color-chip" :style="{ background: color }" />
            {{ color }}
          </n-button>
        </n-flex>
        <n-flex v-if="recentColors.length" :size="8" wrap style="margin-top: 8px">
          <n-tag
            v-for="recent in recentColors"
            :key="recent"
            round
            :style="{ cursor: 'pointer' }"
            @click="updateSourceColor(recent)"
          >
            {{ recent }}
          </n-tag>
        </n-flex>
      </section>

      <section data-testid="gradient-section">
        <n-flex justify="space-between" align="center">
          <n-text depth="3">渐变生成器</n-text>
          <n-button size="small" @click="addGradientStop" :disabled="gradientStops.length >= 5" data-testid="gradient-add-stop">
            新增色标
          </n-button>
        </n-flex>

        <n-space vertical :size="8" style="margin-top: 8px">
          <n-text depth="3">角度</n-text>
          <n-flex :size="10" align="center">
            <n-slider v-model:value="gradientAngle" :step="1" :min="0" :max="360" style="flex: 1" />
            <n-input-number v-model:value="gradientAngle" :min="0" :max="360" style="width: 108px" />
          </n-flex>

          <n-flex v-for="(stop, index) in gradientStops" :key="`${index}-${stop}`" :size="8" align="center">
            <n-input :value="stop" @update:value="(value) => updateGradientStop(index, value)" />
            <n-button
              size="small"
              quaternary
              :disabled="gradientStops.length <= 2"
              @click="removeGradientStop(index)"
            >
              删除
            </n-button>
          </n-flex>

          <div class="gradient-preview" :style="{ background: gradientCss || '#f3f4f6' }" data-testid="gradient-preview" />
          <n-input :value="gradientCss" readonly placeholder="生成的 CSS" data-testid="gradient-css" />
        </n-space>
      </section>

      <section data-testid="contrast-section">
        <n-text depth="3">可访问性对比度（WCAG）</n-text>
        <n-grid :cols="2" :x-gap="10" :y-gap="10" style="margin-top: 8px">
          <n-grid-item>
            <n-text depth="3">前景色</n-text>
            <n-input v-model:value="foreground" data-testid="contrast-foreground" />
          </n-grid-item>
          <n-grid-item>
            <n-text depth="3">背景色</n-text>
            <n-input v-model:value="background" data-testid="contrast-background" />
          </n-grid-item>
        </n-grid>

        <n-alert v-if="!contrastReport" type="warning" title="请输入合法颜色进行对比" style="margin-top: 8px" />
        <n-flex v-else :size="8" style="margin-top: 8px" align="center" wrap>
          <n-tag type="info">对比度 {{ contrastReport.ratio }}:1</n-tag>
          <n-tag :type="contrastReport.normalAA ? 'success' : 'error'">AA {{ contrastReport.normalAA ? '通过' : '不通过' }}</n-tag>
          <n-tag :type="contrastReport.normalAAA ? 'success' : 'error'">AAA {{ contrastReport.normalAAA ? '通过' : '不通过' }}</n-tag>
        </n-flex>
      </section>
    </n-space>
  </n-card>
</template>

<style scoped>
.color-tool {
  border-radius: 14px;
  background-color: rgb(255 255 255 / 92%);
}

.color-tool__grid {
  margin-top: 4px;
}

.color-chip {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  margin-right: 6px;
}

.gradient-preview {
  height: 80px;
  border-radius: 10px;
  border: 1px solid rgb(15 23 42 / 8%);
}

@media (max-width: 900px) {
  .color-tool__grid {
    --n-bezier: ease;
  }
}
</style>
