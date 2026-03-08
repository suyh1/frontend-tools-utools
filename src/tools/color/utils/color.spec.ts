import { describe, expect, it } from 'vitest'
import { buildLinearGradient, getContrastReport, parseColorInput, toHex, toHsl, toRgb } from './color'

describe('color utilities', () => {
  it('converts hex to rgb and hsl', () => {
    const parsed = parseColorInput('#ff0000')

    expect(parsed).not.toBeNull()
    expect(parsed?.rgb).toEqual({ r: 255, g: 0, b: 0 })
    expect(parsed?.hsl.h).toBe(0)
  })

  it('converts rgb to hex and hsl', () => {
    expect(toHex('rgb(255, 255, 255)')).toBe('#FFFFFF')

    const hsl = toHsl('rgb(255, 0, 0)')
    expect(hsl.h).toBe(0)
    expect(hsl.s).toBe(100)
    expect(hsl.l).toBe(50)
  })

  it('builds linear-gradient css string', () => {
    expect(buildLinearGradient(90, ['#ff0000', '#00ff00'])).toBe(
      'linear-gradient(90deg, #FF0000, #00FF00)'
    )
  })

  it('computes wcag contrast ratio and aa/aaa flags', () => {
    const report = getContrastReport('#000000', '#ffffff')

    expect(report).not.toBeNull()
    expect(report?.ratio).toBeGreaterThan(20)
    expect(report?.normalAA).toBe(true)
    expect(report?.normalAAA).toBe(true)
    expect(report?.largeAA).toBe(true)
    expect(report?.largeAAA).toBe(true)
  })

  it('converts hsl to rgb', () => {
    const rgb = toRgb('hsl(240, 100%, 50%)')
    expect(rgb).toEqual({ r: 0, g: 0, b: 255 })
  })
})
