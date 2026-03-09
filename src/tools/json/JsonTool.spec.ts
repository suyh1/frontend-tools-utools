import { createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import JsonTool from './JsonTool.vue'

describe('JsonTool', () => {
  const CodeEditorStub = {
    name: 'CodeEditor',
    props: ['modelValue', 'readonly', 'validators'],
    emits: ['update:modelValue', 'validation-change'],
    template:
      '<div><textarea data-testid="stub-code-editor" :value="modelValue" :readonly="readonly" @input="$emit(\'update:modelValue\', $event.target.value)" /><span :data-testid="readonly ? \'output-validator-count\' : \'input-validator-count\'">{{ Array.isArray(validators) ? validators.length : 0 }}</span></div>'
  }

  it('renders format/minify actions only', () => {
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
    expect(wrapper.find('[data-testid="json-validate"]').exists()).toBe(false)
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

  it('passes validator to input editor only', async () => {
    const wrapper = mount(JsonTool, {
      global: {
        plugins: [createPinia()],
        stubs: {
          CodeEditor: CodeEditorStub
        }
      }
    })

    expect(wrapper.get('[data-testid="input-validator-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="output-validator-count"]').text()).toBe('0')
  })
})
