export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) {
    return false
  }

  if (window.utools?.copyText) {
    return window.utools.copyText(text)
  }

  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return true
  }

  return false
}
