import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import ToolManagerDrawer from './ToolManagerDrawer.vue'
import { useToolLayoutStore } from '@/stores/tool-layout'
import { toolRegistry } from '@/tools/registry'

describe('ToolManagerDrawer', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('adds new group through manager controls', async () => {
    const store = useToolLayoutStore()
    store.initialize(toolRegistry)

    const wrapper = mount(ToolManagerDrawer, {
      props: {
        show: true
      },
      global: {
        stubs: {
          teleport: true,
          NDrawer: {
            template: '<div><slot /></div>'
          },
          NDrawerContent: {
            template: '<div><slot /></div>'
          }
        }
      }
    })

    await wrapper.get('[data-testid="add-group-input"] input').setValue('临时分组')
    await wrapper.get('[data-testid="add-group-button"]').trigger('click')

    expect(store.effectiveConfig.groups.some((group) => group.name === '临时分组')).toBe(true)
  })
})
