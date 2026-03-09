import { forEachDiagnostic, type Diagnostic } from '@codemirror/lint'
import type { Extension } from '@codemirror/state'
import { hoverTooltip, type Rect, type Tooltip } from '@codemirror/view'
import { filterTooltipDiagnostics } from '@/components/code-editor/validation'

export interface PositionedDiagnostic {
  diagnostic: Diagnostic
  from: number
  to: number
}

interface HoverTooltipAnchor {
  pos: number
  end: number
}

interface CoordsProvider {
  coordsAtPos(pos: number, side?: -1 | 1): Rect | null
}

const hiddenRect: Rect = {
  left: -1_000_000,
  right: -1_000_000,
  top: -1_000_000,
  bottom: -1_000_000
}

const severityLabelMap: Record<Diagnostic['severity'], string> = {
  error: '错误',
  warning: '警告',
  info: '信息',
  hint: '提示'
}

function matchesDiagnosticAtPosition(pos: number, side: -1 | 1, from: number, to: number): boolean {
  return (
    pos >= from &&
    pos <= to &&
    (from === to || ((pos > from || side > 0) && (pos < to || side < 0)))
  )
}

function filterMatchedPositionedDiagnostics(
  diagnostics: PositionedDiagnostic[],
  pos: number,
  side: -1 | 1
): PositionedDiagnostic[] {
  return diagnostics.filter((item) => matchesDiagnosticAtPosition(pos, side, item.from, item.to))
}

export function filterHoverPositionedDiagnostics(
  diagnostics: PositionedDiagnostic[],
  pos: number,
  side: -1 | 1
): Diagnostic[] {
  const matchedDiagnostics = filterMatchedPositionedDiagnostics(diagnostics, pos, side).map(
    (item) => item.diagnostic
  )

  return filterTooltipDiagnostics(matchedDiagnostics)
}

export function resolveHoverTooltipAnchor(
  diagnostics: PositionedDiagnostic[],
  hoverPos: number
): HoverTooltipAnchor {
  if (!diagnostics.length) {
    return { pos: hoverPos, end: hoverPos }
  }

  const pos = diagnostics.reduce((minFrom, item) => Math.min(minFrom, item.from), diagnostics[0].from)
  const end = diagnostics.reduce((maxTo, item) => Math.max(maxTo, item.to), diagnostics[0].to)
  return { pos, end }
}

export function resolveHoverTooltipCoords(view: CoordsProvider, anchor: HoverTooltipAnchor): Rect {
  const endCoords = view.coordsAtPos(anchor.end, 1)
  const anchorCoords = endCoords ?? view.coordsAtPos(anchor.pos, 1)
  if (!anchorCoords) {
    return hiddenRect
  }

  return {
    left: anchorCoords.right,
    right: anchorCoords.right,
    top: anchorCoords.bottom,
    bottom: anchorCoords.bottom
  }
}

function createTooltipDom(diagnostics: Diagnostic[]): HTMLElement {
  const list = document.createElement('ul')
  list.className = 'cm-code-tooltip-list'

  for (const diagnostic of diagnostics) {
    const item = document.createElement('li')
    item.className = `cm-code-tooltip-item cm-code-tooltip-item--${diagnostic.severity}`

    const meta = document.createElement('div')
    meta.className = 'cm-code-tooltip-meta'

    const severity = document.createElement('span')
    severity.className = 'cm-code-tooltip-severity'
    severity.textContent = severityLabelMap[diagnostic.severity] ?? '提示'
    meta.appendChild(severity)

    if (diagnostic.source) {
      const source = document.createElement('span')
      source.className = 'cm-code-tooltip-source'
      source.textContent = diagnostic.source
      meta.appendChild(source)
    }

    const message = document.createElement('div')
    message.className = 'cm-code-tooltip-message'
    message.textContent = diagnostic.message

    item.appendChild(meta)
    item.appendChild(message)
    list.appendChild(item)
  }

  const root = document.createElement('div')
  root.className = 'cm-tooltip-lint cm-tooltip-lint-compact'
  root.appendChild(list)
  return root
}

export function createDiagnosticHoverTooltipExtension(): Extension {
  return hoverTooltip(
    (view, pos, side) => {
      const positionedDiagnostics: PositionedDiagnostic[] = []

      forEachDiagnostic(view.state, (diagnostic, from, to) => {
        positionedDiagnostics.push({ diagnostic, from, to })
      })

      const matchedDiagnostics = filterMatchedPositionedDiagnostics(positionedDiagnostics, pos, side)
      const diagnostics = filterTooltipDiagnostics(matchedDiagnostics.map((item) => item.diagnostic))
      if (!diagnostics.length) {
        return null
      }

      const anchor = resolveHoverTooltipAnchor(matchedDiagnostics, pos)

      return {
        pos: anchor.pos,
        end: anchor.end,
        above: false,
        strictSide: true,
        arrow: false,
        clip: false,
        create(): Tooltip['create'] extends (...args: never[]) => infer R ? R : never {
          return {
            dom: createTooltipDom(diagnostics),
            getCoords() {
              return resolveHoverTooltipCoords(view, anchor)
            },
            offset: {
              x: 0,
              y: 0
            },
            overlap: true,
            resize: false
          }
        }
      }
    },
    {
      hoverTime: 220,
      hideOnChange: 'touch'
    }
  )
}
