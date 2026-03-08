export interface JsonErrorDetail {
  message: string
  line: number | null
  column: number | null
  position: number | null
}

export type JsonTransformResult =
  | { ok: true; output: string }
  | { ok: false; error: JsonErrorDetail }

export type JsonValidateResult =
  | { ok: true }
  | { ok: false; error: JsonErrorDetail }
