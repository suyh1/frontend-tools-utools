import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TimestampTool from './TimestampTool.vue'

describe('TimestampTool', () => {
  it('converts timestamp input and renders UTC output', async () => {
    const wrapper = mount(TimestampTool)

    const input = wrapper.get('[data-testid="timestamp-input"] input')
    await input.setValue('1704067200')

    await wrapper.get('[data-testid="timestamp-convert"]').trigger('click')

    expect(wrapper.text()).toContain('2024-01-01T00:00:00.000Z')
  })
})
