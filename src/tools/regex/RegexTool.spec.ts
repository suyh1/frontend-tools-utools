import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RegexTool from './RegexTool.vue'

describe('RegexTool', () => {
  const CodeEditorStub = {
    name: 'CodeEditor',
    props: ['modelValue', 'readonly', 'validators'],
    emits: ['update:modelValue', 'validation-change'],
    template:
      '<div><textarea data-testid="stub-code-editor" :value="modelValue" :readonly="readonly" @input="$emit(\'update:modelValue\', $event.target.value)" /><span :data-testid="readonly ? \'output-validator-count\' : \'input-validator-count\'">{{ Array.isArray(validators) ? validators.length : 0 }}</span></div>'
  }

  it('runs regex matching and displays match count', async () => {
    const wrapper = mount(RegexTool, {
      global: {
        stubs: {
          CodeEditor: CodeEditorStub
        }
      }
    })

    await wrapper.get('[data-testid="regex-pattern"] input').setValue('foo(\\d+)')
    await wrapper.get('[data-testid="regex-flags"] input').setValue('g')
    await wrapper.get('[data-testid="stub-code-editor"]').setValue('foo1 foo2')

    await wrapper.get('[data-testid="regex-match"]').trigger('click')

    expect(wrapper.text()).toContain('匹配数：2')
  })

  it('passes validator to input editor only', () => {
    const wrapper = mount(RegexTool, {
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
