import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import JwtTool from './JwtTool.vue'

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function createToken(payload: Record<string, unknown>) {
  const header = { alg: 'HS256', typ: 'JWT' }
  return `${toBase64Url(JSON.stringify(header))}.${toBase64Url(JSON.stringify(payload))}.signature`
}

describe('JwtTool', () => {
  const CodeEditorStub = {
    name: 'CodeEditor',
    props: ['modelValue', 'readonly', 'validators'],
    emits: ['update:modelValue', 'validation-change'],
    template:
      '<div><textarea data-testid="stub-code-editor" :value="modelValue" :readonly="readonly" @input="$emit(\'update:modelValue\', $event.target.value)" /><span :data-testid="readonly ? \'output-validator-count\' : \'input-validator-count\'">{{ Array.isArray(validators) ? validators.length : 0 }}</span></div>'
  }

  it('parses token and renders payload', async () => {
    const wrapper = mount(JwtTool, {
      global: {
        stubs: {
          CodeEditor: CodeEditorStub
        }
      }
    })

    const token = createToken({ sub: '100', exp: 2_000_000_000 })
    await wrapper.get('[data-testid="stub-code-editor"]').setValue(token)
    await wrapper.get('[data-testid="jwt-parse"]').trigger('click')

    const payloadEditor = wrapper.findAll('[data-testid="stub-code-editor"]')[2].element as HTMLTextAreaElement
    expect(payloadEditor.value).toContain('"sub": "100"')
  })

  it('passes validator to token editor only', async () => {
    const wrapper = mount(JwtTool, {
      global: {
        stubs: {
          CodeEditor: CodeEditorStub
        }
      }
    })

    expect(wrapper.get('[data-testid="input-validator-count"]').text()).toBe('1')

    const token = createToken({ sub: '100' })
    await wrapper.get('[data-testid="stub-code-editor"]').setValue(token)
    await wrapper.get('[data-testid="jwt-parse"]').trigger('click')

    const outputCounts = wrapper.findAll('[data-testid="output-validator-count"]')
    expect(outputCounts).toHaveLength(2)
    expect(outputCounts.map((item) => item.text())).toEqual(['0', '0'])
  })
})
