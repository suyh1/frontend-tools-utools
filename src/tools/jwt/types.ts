export interface JwtTimeField {
  epochSeconds: number
  isoUtc: string
  localText: string
  relativeText: string
}

export interface JwtTimeFields {
  iat?: JwtTimeField
  nbf?: JwtTimeField
  exp?: JwtTimeField
}

export interface JwtStatus {
  expired: boolean
  notYetValid: boolean
}

export interface JwtParsedData {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
  timeFields: JwtTimeFields
  status: JwtStatus
}

export type JwtParseResult =
  | {
      ok: true
      data: JwtParsedData
    }
  | {
      ok: false
      error: string
    }
