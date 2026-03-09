import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import UrlTool from './UrlTool.vue'

describe('UrlTool', () => {
  it('parses url and fills host field', async () => {
    const wrapper = mount(UrlTool)

    await wrapper.get('[data-testid="url-input"] textarea').setValue('https://example.com/docs?q=vite')
    await wrapper.get('[data-testid="url-parse"]').trigger('click')

    const host = wrapper.get('[data-testid="url-host"] input').element as HTMLInputElement
    expect(host.value).toBe('example.com')
  })
})
