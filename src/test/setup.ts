import { vi } from 'vitest'

Object.defineProperty(window, 'utools', {
  configurable: true,
  writable: true,
  value: {
    onPluginEnter: vi.fn(),
    onPluginOut: vi.fn(),
    showNotification: vi.fn()
  }
})

Object.defineProperty(window, 'services', {
  configurable: true,
  writable: true,
  value: {
    readFile: vi.fn(),
    writeTextFile: vi.fn(),
    writeImageFile: vi.fn()
  }
})
