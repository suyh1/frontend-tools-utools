export type CodecMode =
  | 'url-encode'
  | 'url-decode'
  | 'base64-encode'
  | 'base64-decode'
  | 'html-encode'
  | 'html-decode'
  | 'unicode-escape'
  | 'unicode-unescape'

export type CodecTransformResult =
  | {
      ok: true
      output: string
    }
  | {
      ok: false
      error: string
    }
