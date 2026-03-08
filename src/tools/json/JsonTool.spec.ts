import { createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import JsonTool from './JsonTool.vue'

describe('JsonTool', () => {
  it('renders format/minify/validate actions', () => {
    const wrapper = mount(JsonTool, {
      global: {
        plugins: [createPinia()]
      }
    })

    expect(wrapper.text()).toContain('格式化')
    expect(wrapper.text()).toContain('压缩')
    expect(wrapper.text()).toContain('校验')
  })

  it('shows error when invalid json is validated', async () => {
    const wrapper = mount(JsonTool, {
      global: {
        plugins: [createPinia()]
      }
    })

    const input = wrapper.find('textarea')
    await input.setValue('{"a":}')

    await wrapper.get('[data-testid="json-validate"]').trigger('click')

    expect(wrapper.text()).toContain('JSON 校验失败')
  })
})
