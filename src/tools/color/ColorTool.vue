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
  <n-card :bordered="false" class="color-tool">
    <div class="color-tool__hero">
      <div>
        <n-text class="color-tool__title" strong>颜色工具</n-text>
        <n-text depth="3" class="color-tool__subtitle">颜色转换、渐变生成与可访问性检测</n-text>
      </div>
      <n-space :size="8">
        <n-button size="small" @click="handleCopyGradient" data-testid="color-copy-gradient">复制渐变 CSS</n-button>
        <n-button size="small" quaternary @click="resetAll" data-testid="color-reset">重置</n-button>
      </n-space>
    </div>

    <section class="color-section">
      <div class="color-section__head">
        <n-text depth="3">输入颜色</n-text>
        <n-tag round>Multi Format</n-tag>
      </div>

      <n-input
        v-model:value="sourceInput"
        placeholder="支持 #HEX / rgb() / hsl()"
        data-testid="color-source-input"
      />
      <n-alert v-if="sourceInvalid" type="error" title="颜色格式无效" class="color-section__alert" />

      <n-grid :cols="3" :x-gap="10" :y-gap="10" class="color-tool__convert-grid">
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
    </section>

    <div class="color-tool__dual-grid">
      <section class="color-section">
        <div class="color-section__head">
          <n-text depth="3">调色板</n-text>
          <n-tag round>Palette</n-tag>
        </div>

        <n-flex :size="8" wrap>
          <n-button
            v-for="color in basePalette"
            :key="color"
            tertiary
            @click="updateSourceColor(color)"
            class="color-palette-btn"
          >
            <span class="color-chip" :style="{ background: color }" />
            {{ color }}
          </n-button>
        </n-flex>

        <n-flex v-if="recentColors.length" :size="8" wrap class="color-tool__recent-line">
          <n-tag
            v-for="recent in recentColors"
            :key="recent"
            round
            class="color-tool__recent-tag"
            @click="updateSourceColor(recent)"
          >
            {{ recent }}
          </n-tag>
        </n-flex>
      </section>

      <section class="color-section" data-testid="gradient-section">
        <div class="color-section__head">
          <n-text depth="3">渐变生成器</n-text>
          <n-button size="small" @click="addGradientStop" :disabled="gradientStops.length >= 5" data-testid="gradient-add-stop">
            新增色标
          </n-button>
        </div>

        <n-space vertical :size="8">
          <n-text depth="3">角度</n-text>
          <n-flex :size="10" align="center">
            <n-slider v-model:value="gradientAngle" :step="1" :min="0" :max="360" style="flex: 1" />
            <n-input-number v-model:value="gradientAngle" :min="0" :max="360" style="width: 108px" />
          </n-flex>

          <n-flex v-for="(stop, index) in gradientStops" :key="`${index}-${stop}`" :size="8" align="center">
            <n-tag size="small" class="color-tool__stop-index">{{ index + 1 }}</n-tag>
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
    </div>

    <section class="color-section" data-testid="contrast-section">
      <div class="color-section__head">
        <n-text depth="3">可访问性对比度（WCAG）</n-text>
        <n-tag round>Accessibility</n-tag>
      </div>

      <n-grid :cols="2" :x-gap="10" :y-gap="10">
        <n-grid-item>
          <n-text depth="3">前景色</n-text>
          <n-input v-model:value="foreground" data-testid="contrast-foreground" />
        </n-grid-item>
        <n-grid-item>
          <n-text depth="3">背景色</n-text>
          <n-input v-model:value="background" data-testid="contrast-background" />
        </n-grid-item>
      </n-grid>

      <n-alert v-if="!contrastReport" type="warning" title="请输入合法颜色进行对比" class="color-section__alert" />
      <n-flex v-else :size="8" class="color-tool__contrast-tags" align="center" wrap>
        <n-tag type="info">对比度 {{ contrastReport.ratio }}:1</n-tag>
        <n-tag :type="contrastReport.normalAA ? 'success' : 'error'">AA {{ contrastReport.normalAA ? '通过' : '不通过' }}</n-tag>
        <n-tag :type="contrastReport.normalAAA ? 'success' : 'error'">AAA {{ contrastReport.normalAAA ? '通过' : '不通过' }}</n-tag>
      </n-flex>
    </section>
  </n-card>
</template>

<style scoped>
.color-tool {
  border-radius: 20px;
  background: rgb(255 255 255 / 68%);
  border: 1px solid rgb(255 255 255 / 74%);
  box-shadow: 0 22px 44px rgb(15 23 42 / 9%);
  backdrop-filter: blur(14px);
}

.color-tool__hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.color-tool__title {
  display: block;
  font-size: 20px;
  color: #0f172a;
}

.color-tool__subtitle {
  display: block;
  margin-top: 3px;
  font-size: 12px;
}

.color-section {
  border-radius: 16px;
  border: 1px solid rgb(255 255 255 / 74%);
  background: rgb(255 255 255 / 62%);
  padding: 12px;
}

.color-section + .color-section,
.color-tool__dual-grid,
.color-tool__dual-grid + .color-section {
  margin-top: 12px;
}

.color-section__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.color-section__alert {
  margin-top: 8px;
}

.color-tool__convert-grid {
  margin-top: 10px;
}

.color-tool__dual-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.color-palette-btn {
  border: 1px solid rgb(255 255 255 / 80%);
  background: rgb(255 255 255 / 62%);
}

.color-chip {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  margin-right: 6px;
}

.color-tool__recent-line {
  margin-top: 8px;
}

.color-tool__recent-tag {
  cursor: pointer;
  border: 1px solid rgb(255 255 255 / 80%);
  background: rgb(255 255 255 / 62%);
}

.color-tool__stop-index {
  min-width: 24px;
  justify-content: center;
}

.gradient-preview {
  height: 84px;
  border-radius: 12px;
  border: 1px solid rgb(15 23 42 / 8%);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 46%);
}

.color-tool__contrast-tags {
  margin-top: 10px;
}

@media (max-width: 980px) {
  .color-tool__dual-grid {
    grid-template-columns: 1fr;
  }

  .color-tool__convert-grid {
    --n-bezier: ease;
  }
}
</style>
