import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MoreToolsPopover from './MoreToolsPopover.vue'

describe('MoreToolsPopover', () => {
  it('renders grouped tool actions in popover content', async () => {
    const wrapper = mount(MoreToolsPopover, {
      props: {
        activeToolId: 'json',
        groups: [
          {
            id: 'data',
            name: '数据解析',
            tools: [
              { id: 'json', name: 'JSON 工具', icon: 'J', keywords: ['json'] },
              { id: 'url', name: 'URL 工具', icon: 'U', keywords: ['url'] }
            ]
          }
        ]
      },
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    await wrapper.get('[data-testid="more-tools-trigger"]').trigger('click')

    expect(wrapper.html()).toContain('数据解析')
    expect(wrapper.find('[data-testid="more-tool-json"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="more-tool-url"]').exists()).toBe(true)
  })
})
