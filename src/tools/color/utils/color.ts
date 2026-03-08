import type { ContrastReport, HslColor, ParsedColor, RgbColor } from '@/tools/color/types'

type ColorInput = string | RgbColor | HslColor

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function isRgbColor(value: unknown): value is RgbColor {
  if (!value || typeof value !== 'object') {
    return false
  }

  const rgb = value as Partial<RgbColor>
  return typeof rgb.r === 'number' && typeof rgb.g === 'number' && typeof rgb.b === 'number'
}

function isHslColor(value: unknown): value is HslColor {
  if (!value || typeof value !== 'object') {
    return false
  }

  const hsl = value as Partial<HslColor>
  return typeof hsl.h === 'number' && typeof hsl.s === 'number' && typeof hsl.l === 'number'
}

function normalizeHex(hex: string): string {
  const normalized = hex.trim().replace(/^#/, '').toUpperCase()
  if (normalized.length === 3) {
    return normalized
      .split('')
      .map((char) => char + char)
      .join('')
  }
  return normalized
}

function hexToRgb(hex: string): RgbColor | null {
  const normalized = normalizeHex(hex)
  if (!/^[0-9A-F]{6}$/.test(normalized)) {
    return null
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  }
}

function rgbToHex(rgb: RgbColor): string {
  const toHexPart = (value: number) => clamp(Math.round(value), 0, 255).toString(16).toUpperCase().padStart(2, '0')
  return `#${toHexPart(rgb.r)}${toHexPart(rgb.g)}${toHexPart(rgb.b)}`
}

function rgbToHsl(rgb: RgbColor): HslColor {
  const r = clamp(rgb.r, 0, 255) / 255
  const g = clamp(rgb.g, 0, 255) / 255
  const b = clamp(rgb.b, 0, 255) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  const l = (max + min) / 2
  let s = 0

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))

    if (max === r) {
      h = ((g - b) / delta) % 6
    } else if (max === g) {
      h = (b - r) / delta + 2
    } else {
      h = (r - g) / delta + 4
    }

    h *= 60
    if (h < 0) {
      h += 360
    }
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

function hslToRgb(hsl: HslColor): RgbColor {
  const h = ((hsl.h % 360) + 360) % 360
  const s = clamp(hsl.s, 0, 100) / 100
  const l = clamp(hsl.l, 0, 100) / 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let rPrime = 0
  let gPrime = 0
  let bPrime = 0

  if (h < 60) {
    rPrime = c
    gPrime = x
  } else if (h < 120) {
    rPrime = x
    gPrime = c
  } else if (h < 180) {
    gPrime = c
    bPrime = x
  } else if (h < 240) {
    gPrime = x
    bPrime = c
  } else if (h < 300) {
    rPrime = x
    bPrime = c
  } else {
    rPrime = c
    bPrime = x
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255)
  }
}

function parseRgbText(text: string): RgbColor | null {
  const match = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(text.trim())
  if (!match) {
    return null
  }

  const values = match.slice(1).map((segment) => Number(segment))
  if (values.some((value) => Number.isNaN(value) || value < 0 || value > 255)) {
    return null
  }

  return {
    r: values[0],
    g: values[1],
    b: values[2]
  }
}

function parseHslText(text: string): HslColor | null {
  const match = /^hsl\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i.exec(text.trim())
  if (!match) {
    return null
  }

  const h = Number(match[1])
  const s = Number(match[2])
  const l = Number(match[3])

  if ([h, s, l].some((value) => Number.isNaN(value))) {
    return null
  }

  if (s < 0 || s > 100 || l < 0 || l > 100) {
    return null
  }

  return { h, s, l }
}

function normalizeInputToRgb(input: ColorInput): RgbColor | null {
  if (typeof input === 'string') {
    const trimmed = input.trim()

    if (trimmed.startsWith('#') || /^[0-9a-f]{3,6}$/i.test(trimmed)) {
      return hexToRgb(trimmed)
    }

    const rgb = parseRgbText(trimmed)
    if (rgb) {
      return rgb
    }

    const hsl = parseHslText(trimmed)
    if (hsl) {
      return hslToRgb(hsl)
    }

    return null
  }

  if (isRgbColor(input)) {
    return {
      r: clamp(Math.round(input.r), 0, 255),
      g: clamp(Math.round(input.g), 0, 255),
      b: clamp(Math.round(input.b), 0, 255)
    }
  }

  if (isHslColor(input)) {
    return hslToRgb(input)
  }

  return null
}

export function parseColorInput(input: string): ParsedColor | null {
  const rgb = normalizeInputToRgb(input)
  if (!rgb) {
    return null
  }

  return {
    rgb,
    hex: rgbToHex(rgb),
    hsl: rgbToHsl(rgb)
  }
}

export function toHex(input: ColorInput): string {
  const rgb = normalizeInputToRgb(input)
  if (!rgb) {
    throw new Error('Invalid color input')
  }
  return rgbToHex(rgb)
}

export function toRgb(input: ColorInput): RgbColor {
  const rgb = normalizeInputToRgb(input)
  if (!rgb) {
    throw new Error('Invalid color input')
  }
  return rgb
}

export function toHsl(input: ColorInput): HslColor {
  const rgb = normalizeInputToRgb(input)
  if (!rgb) {
    throw new Error('Invalid color input')
  }
  return rgbToHsl(rgb)
}

export function buildLinearGradient(angle: number, colors: string[]): string {
  const normalizedColors = colors
    .map((color) => toHex(color))
    .slice(0, 5)

  if (normalizedColors.length < 2) {
    throw new Error('At least two valid colors are required')
  }

  return `linear-gradient(${Math.round(angle)}deg, ${normalizedColors.join(', ')})`
}

function toLinearChannel(value: number): number {
  const sRgb = value / 255
  if (sRgb <= 0.03928) {
    return sRgb / 12.92
  }
  return ((sRgb + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(rgb: RgbColor): number {
  const r = toLinearChannel(rgb.r)
  const g = toLinearChannel(rgb.g)
  const b = toLinearChannel(rgb.b)

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function getContrastReport(foreground: string, background: string): ContrastReport | null {
  const fgRgb = normalizeInputToRgb(foreground)
  const bgRgb = normalizeInputToRgb(background)

  if (!fgRgb || !bgRgb) {
    return null
  }

  const fgLum = relativeLuminance(fgRgb)
  const bgLum = relativeLuminance(bgRgb)

  const lighter = Math.max(fgLum, bgLum)
  const darker = Math.min(fgLum, bgLum)
  const ratio = (lighter + 0.05) / (darker + 0.05)

  return {
    ratio: Number(ratio.toFixed(2)),
    normalAA: ratio >= 4.5,
    normalAAA: ratio >= 7,
    largeAA: ratio >= 3,
    largeAAA: ratio >= 4.5
  }
}
