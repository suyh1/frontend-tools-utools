import { createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ColorTool from './ColorTool.vue'

describe('ColorTool', () => {
  it('renders color conversion fields and preview', () => {
    const wrapper = mount(ColorTool, {
      global: {
        plugins: [createPinia()]
      }
    })

    expect(wrapper.text()).toContain('HEX')
    expect(wrapper.text()).toContain('RGB')
    expect(wrapper.text()).toContain('HSL')
    expect(wrapper.find('[data-testid="gradient-preview"]').exists()).toBe(true)
  })

  it('renders gradient generator controls', () => {
    const wrapper = mount(ColorTool, {
      global: {
        plugins: [createPinia()]
      }
    })

    expect(wrapper.find('[data-testid="gradient-section"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('新增色标')
  })

  it('shows wcag report for foreground/background', () => {
    const wrapper = mount(ColorTool, {
      global: {
        plugins: [createPinia()]
      }
    })

    expect(wrapper.find('[data-testid="contrast-section"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('对比度')
    expect(wrapper.text()).toContain('AA')
  })
})
