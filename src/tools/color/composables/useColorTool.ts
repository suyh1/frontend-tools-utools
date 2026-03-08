import { computed, ref } from 'vue'
import { copyTextToClipboard } from '@/composables/useClipboard'
import { buildLinearGradient, getContrastReport, parseColorInput } from '@/tools/color/utils/color'

const DEFAULT_SOURCE = '#3A7AFE'
const DEFAULT_STOPS = ['#3A7AFE', '#00C2A8']

export function useColorTool() {
  const sourceInput = ref(DEFAULT_SOURCE)
  const recentColors = ref<string[]>([])

  const gradientAngle = ref(90)
  const gradientStops = ref<string[]>([...DEFAULT_STOPS])

  const foreground = ref('#111111')
  const background = ref('#FFFFFF')

  const parsed = computed(() => parseColorInput(sourceInput.value))

  const sourceInvalid = computed(() => sourceInput.value.trim().length > 0 && parsed.value === null)

  const hexText = computed(() => parsed.value?.hex ?? '')

  const rgbText = computed(() => {
    if (!parsed.value) {
      return ''
    }
    const { r, g, b } = parsed.value.rgb
    return `rgb(${r}, ${g}, ${b})`
  })

  const hslText = computed(() => {
    if (!parsed.value) {
      return ''
    }
    const { h, s, l } = parsed.value.hsl
    return `hsl(${h}, ${s}%, ${l}%)`
  })

  function pushRecent(color: string) {
    const parsedColor = parseColorInput(color)
    if (!parsedColor) {
      return
    }

    const hex = parsedColor.hex
    recentColors.value = [hex, ...recentColors.value.filter((item) => item !== hex)].slice(0, 8)
  }

  function updateSourceColor(color: string) {
    sourceInput.value = color
    pushRecent(color)
  }

  function addGradientStop() {
    if (gradientStops.value.length >= 5) {
      return
    }

    const fallback = gradientStops.value[gradientStops.value.length - 1] ?? DEFAULT_SOURCE
    gradientStops.value.push(fallback)
  }

  function removeGradientStop(index: number) {
    if (gradientStops.value.length <= 2) {
      return
    }

    gradientStops.value.splice(index, 1)
  }

  function updateGradientStop(index: number, color: string) {
    gradientStops.value[index] = color
  }

  const gradientCss = computed(() => {
    try {
      return buildLinearGradient(gradientAngle.value, gradientStops.value)
    } catch {
      return ''
    }
  })

  const contrastReport = computed(() => getContrastReport(foreground.value, background.value))

  async function copyGradientCss() {
    if (!gradientCss.value) {
      return false
    }

    return copyTextToClipboard(gradientCss.value)
  }

  function resetAll() {
    sourceInput.value = DEFAULT_SOURCE
    gradientAngle.value = 90
    gradientStops.value = [...DEFAULT_STOPS]
    foreground.value = '#111111'
    background.value = '#FFFFFF'
  }

  return {
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
  }
}
