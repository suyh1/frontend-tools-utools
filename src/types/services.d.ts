export interface PreloadServices {
  readFile(file: string): string
  writeTextFile(text: string): string
  writeImageFile(base64Url: string): string | undefined
}

declare global {
  interface Window {
    services: PreloadServices
  }
}

export {}
