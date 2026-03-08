import { createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import JsonTool from './JsonTool.vue'

describe('JsonTool', () => {
  const CodeEditorStub = {
    name: 'CodeEditor',
    props: ['modelValue', 'readonly'],
    emits: ['update:modelValue'],
    template:
      '<textarea data-testid="stub-code-editor" :value="modelValue" :readonly="readonly" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  }

  it('renders format/minify/validate actions', () => {
    const wrapper = mount(JsonTool, {
      global: {
        plugins: [createPinia()],
        stubs: {
          CodeEditor: CodeEditorStub
        }
      }
    })

    expect(wrapper.text()).toContain('格式化')
    expect(wrapper.text()).toContain('压缩')
    expect(wrapper.text()).toContain('校验')
  })

  it('renders language selector for multi-language editing', () => {
    const wrapper = mount(JsonTool, {
      global: {
        plugins: [createPinia()],
        stubs: {
          CodeEditor: CodeEditorStub
        }
      }
    })

    expect(wrapper.text()).toContain('语言')
  })

  it('shows error when invalid json is validated', async () => {
    const wrapper = mount(JsonTool, {
      global: {
        plugins: [createPinia()],
        stubs: {
          CodeEditor: CodeEditorStub
        }
      }
    })

    const input = wrapper.find('[data-testid="stub-code-editor"]')
    await input.setValue('{"a":}')

    await wrapper.get('[data-testid="json-validate"]').trigger('click')

    expect(wrapper.text()).toContain('JSON 校验失败')
  })
})
