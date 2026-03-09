export type TimestampSourceUnit = 'seconds' | 'milliseconds' | 'datetime'

export type TimestampParseResult =
  | {
      ok: true
      timestampMs: number
      sourceUnit: TimestampSourceUnit
    }
  | {
      ok: false
      error: string
    }

export interface TimestampView {
  timestampMs: number
  timestampSec: number
  isoUtc: string
  localText: string
  relativeText: string
}

export type TimestampConvertResult =
  | {
      ok: true
      view: TimestampView
      sourceUnit: TimestampSourceUnit
    }
  | {
      ok: false
      error: string
    }
