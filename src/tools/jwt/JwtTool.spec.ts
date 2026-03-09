import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import JwtTool from './JwtTool.vue'

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function createToken(payload: Record<string, unknown>) {
  const header = { alg: 'HS256', typ: 'JWT' }
  return `${toBase64Url(JSON.stringify(header))}.${toBase64Url(JSON.stringify(payload))}.signature`
}

describe('JwtTool', () => {
  it('parses token and renders payload', async () => {
    const wrapper = mount(JwtTool)

    const token = createToken({ sub: '100', exp: 2_000_000_000 })
    await wrapper.get('[data-testid="jwt-input"] textarea').setValue(token)
    await wrapper.get('[data-testid="jwt-parse"]').trigger('click')

    expect(wrapper.text()).toContain('"sub": "100"')
  })
})
