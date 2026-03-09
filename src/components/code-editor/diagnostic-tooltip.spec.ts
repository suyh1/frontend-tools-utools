import { describe, expect, it } from 'vitest'
import type { Diagnostic } from '@codemirror/lint'
import {
  filterHoverPositionedDiagnostics,
  resolveHoverTooltipAnchor,
  resolveHoverTooltipCoords
} from '@/components/code-editor/diagnostic-tooltip'

function makeDiagnostic(message: string, severity: Diagnostic['severity']): Diagnostic {
  return {
    from: 0,
    to: 0,
    message,
    severity
  }
}

describe('diagnostic hover tooltip', () => {
  it('keeps all matched diagnostics and sorts by severity', () => {
    const result = filterHoverPositionedDiagnostics(
      [
        { diagnostic: makeDiagnostic('warning', 'warning'), from: 5, to: 7 },
        { diagnostic: makeDiagnostic('error', 'error'), from: 5, to: 7 },
        { diagnostic: makeDiagnostic('info-outside', 'info'), from: 20, to: 22 }
      ],
      6,
      1
    )

    expect(result.map((item) => item.message)).toEqual(['error', 'warning'])
  })

  it('uses side to decide if range edge should trigger tooltip', () => {
    const diagnostics = [{ diagnostic: makeDiagnostic('edge', 'error'), from: 10, to: 12 }]

    const beforeStart = filterHoverPositionedDiagnostics(diagnostics, 10, -1)
    const afterStart = filterHoverPositionedDiagnostics(diagnostics, 10, 1)

    expect(beforeStart).toHaveLength(0)
    expect(afterStart).toHaveLength(1)
  })

  it('always includes zero-length diagnostics at exact position', () => {
    const result = filterHoverPositionedDiagnostics(
      [{ diagnostic: makeDiagnostic('point', 'error'), from: 4, to: 4 }],
      4,
      -1
    )

    expect(result).toHaveLength(1)
  })

  it('anchors tooltip to matched diagnostic range instead of hover position', () => {
    const anchor = resolveHoverTooltipAnchor(
      [
        { diagnostic: makeDiagnostic('error-main', 'error'), from: 20, to: 28 },
        { diagnostic: makeDiagnostic('warning-extended', 'warning'), from: 24, to: 32 }
      ],
      27
    )

    expect(anchor).toEqual({
      pos: 20,
      end: 32
    })
  })

  it('falls back to hover position when no diagnostic is matched', () => {
    const anchor = resolveHoverTooltipAnchor([], 12)
    expect(anchor).toEqual({
      pos: 12,
      end: 12
    })
  })

  it('uses the diagnostic end position right-bottom as tooltip anchor point', () => {
    const rect = resolveHoverTooltipCoords(
      {
        coordsAtPos(pos: number) {
          if (pos === 32) {
            return {
              left: 110,
              right: 128,
              top: 200,
              bottom: 218
            }
          }

          return null
        }
      },
      { pos: 20, end: 32 }
    )

    expect(rect).toEqual({
      left: 128,
      right: 128,
      top: 218,
      bottom: 218
    })
  })

  it('falls back to range start coordinates when end coordinates are unavailable', () => {
    const rect = resolveHoverTooltipCoords(
      {
        coordsAtPos(pos: number) {
          if (pos === 20) {
            return {
              left: 60,
              right: 72,
              top: 88,
              bottom: 102
            }
          }

          return null
        }
      },
      { pos: 20, end: 32 }
    )

    expect(rect).toEqual({
      left: 72,
      right: 72,
      top: 102,
      bottom: 102
    })
  })
})
