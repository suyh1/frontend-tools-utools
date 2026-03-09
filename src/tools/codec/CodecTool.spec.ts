import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CodecTool from './CodecTool.vue'

describe('CodecTool', () => {
  it('transforms input text with selected mode', async () => {
    const wrapper = mount(CodecTool)

    const input = wrapper.get('[data-testid="codec-input"] textarea')
    await input.setValue('hello world')

    await wrapper.get('[data-testid="codec-run"]').trigger('click')

    const output = wrapper.get('[data-testid="codec-output"] textarea').element as HTMLTextAreaElement
    expect(output.value).toContain('%20')
  })
})
