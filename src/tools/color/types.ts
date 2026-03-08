export interface RgbColor {
  r: number
  g: number
  b: number
}

export interface HslColor {
  h: number
  s: number
  l: number
}

export interface ParsedColor {
  hex: string
  rgb: RgbColor
  hsl: HslColor
}

export interface ContrastReport {
  ratio: number
  normalAA: boolean
  normalAAA: boolean
  largeAA: boolean
  largeAAA: boolean
}
