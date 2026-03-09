import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RegexTool from './RegexTool.vue'

describe('RegexTool', () => {
  it('runs regex matching and displays match count', async () => {
    const wrapper = mount(RegexTool)

    await wrapper.get('[data-testid="regex-pattern"] input').setValue('foo(\\d+)')
    await wrapper.get('[data-testid="regex-flags"] input').setValue('g')
    await wrapper.get('[data-testid="regex-input"] textarea').setValue('foo1 foo2')

    await wrapper.get('[data-testid="regex-match"]').trigger('click')

    expect(wrapper.text()).toContain('匹配数：2')
  })
})
