import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CodecTool from './CodecTool.vue'

describe('CodecTool', () => {
  const CodeEditorStub = {
    name: 'CodeEditor',
    props: ['modelValue', 'readonly', 'validators'],
    emits: ['update:modelValue', 'validation-change'],
    template:
      '<div><textarea data-testid="stub-code-editor" :value="modelValue" :readonly="readonly" @input="$emit(\'update:modelValue\', $event.target.value)" /><span :data-testid="readonly ? \'output-validator-count\' : \'input-validator-count\'">{{ Array.isArray(validators) ? validators.length : 0 }}</span></div>'
  }

  it('transforms input text with selected mode', async () => {
    const wrapper = mount(CodecTool, {
      global: {
        stubs: {
          CodeEditor: CodeEditorStub
        }
      }
    })

    const input = wrapper.get('[data-testid="stub-code-editor"]')
    await input.setValue('hello world')

    await wrapper.get('[data-testid="codec-run"]').trigger('click')

    const output = wrapper.findAll('[data-testid="stub-code-editor"]')[1].element as HTMLTextAreaElement
    expect(output.value).toContain('%20')
  })

  it('passes validator to input editor only', () => {
    const wrapper = mount(CodecTool, {
      global: {
        stubs: {
          CodeEditor: CodeEditorStub
        }
      }
    })

    expect(wrapper.get('[data-testid="input-validator-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="output-validator-count"]').text()).toBe('0')
  })
})
