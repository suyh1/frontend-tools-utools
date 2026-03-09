<script setup lang="ts">
import { forceLinting, linter } from '@codemirror/lint'
import { Compartment, EditorState } from '@codemirror/state'
import { EditorView, type ViewUpdate } from '@codemirror/view'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createEditorFeatureExtensions } from '@/components/code-editor/extensions'
import { resolveLanguageExtension } from '@/components/code-editor/languages'
import { codeEditorThemeExtension } from '@/components/code-editor/theme'
import { runCodeEditorValidators, toCodeMirrorDiagnostics } from '@/components/code-editor/validation'
import type {
  CodeEditorValidationReport,
  CodeEditorValidator,
  CodeLanguage,
  CodeSelectionChange
} from '@/components/code-editor/types'

const props = withDefaults(
  defineProps<{
    modelValue: string
    language: CodeLanguage
    readonly?: boolean
    minHeight?: number
    maxHeight?: number | 'auto'
    enhanced?: boolean
    lineNumbers?: boolean
    wordWrap?: boolean
    placeholder?: string
    validators?: CodeEditorValidator[]
    validationDebounce?: number
  }>(),
  {
    readonly: false,
    minHeight: 240,
    maxHeight: 'auto',
    enhanced: true,
    lineNumbers: true,
    wordWrap: false,
    placeholder: '',
    validators: () => [],
    validationDebounce: 300
  }
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'focus'): void
  (event: 'blur'): void
  (event: 'selection-change', payload: CodeSelectionChange): void
  (event: 'validation-change', payload: CodeEditorValidationReport): void
}>()

const rootRef = ref<HTMLDivElement | null>(null)

let editorView: EditorView | null = null

const languageCompartment = new Compartment()
const featureCompartment = new Compartment()
const validationCompartment = new Compartment()
let validationRunId = 0

const cssVars = computed(() => {
  const maxHeight = props.maxHeight === 'auto' ? 'none' : `${props.maxHeight}px`
  return {
    '--code-editor-min-height': `${props.minHeight}px`,
    '--code-editor-max-height': maxHeight
  }
})

function createFeatureExtensions() {
  return createEditorFeatureExtensions({
    enhanced: props.enhanced,
    lineNumbers: props.lineNumbers,
    wordWrap: props.wordWrap,
    readonly: props.readonly,
    placeholderText: props.placeholder
  })
}

function emitValidationReport(report: CodeEditorValidationReport) {
  emit('validation-change', report)
}

function emitCleanValidationReport() {
  emitValidationReport({
    diagnostics: [],
    hasError: false,
    hasWarning: false,
    valid: true
  })
}

function createValidationExtensions() {
  if (!props.validators.length) {
    return []
  }

  return [
    linter(
      async (view) => {
        const currentRunId = ++validationRunId
        const report = await runCodeEditorValidators({
          validators: props.validators,
          value: view.state.doc.toString(),
          language: props.language
        })

        if (currentRunId !== validationRunId) {
          return []
        }

        emitValidationReport(report)
        return toCodeMirrorDiagnostics(report.diagnostics)
      },
      {
        delay: Math.max(0, props.validationDebounce)
      }
    )
  ]
}

function handleUpdate(update: ViewUpdate) {
  if (update.docChanged) {
    const current = update.state.doc.toString()
    if (current !== props.modelValue) {
      emit('update:modelValue', current)
    }
  }

  if (update.focusChanged) {
    if (update.view.hasFocus) {
      emit('focus')
    } else {
      emit('blur')
    }
  }

  if (update.selectionSet) {
    const selection = update.state.selection.main
    emit('selection-change', {
      from: selection.from,
      to: selection.to,
      text: update.state.doc.sliceString(selection.from, selection.to)
    })
  }
}

function createEditorState() {
  return EditorState.create({
    doc: props.modelValue,
    extensions: [
      codeEditorThemeExtension,
      languageCompartment.of(resolveLanguageExtension(props.language)),
      featureCompartment.of(createFeatureExtensions()),
      validationCompartment.of(createValidationExtensions()),
      EditorView.updateListener.of(handleUpdate)
    ]
  })
}

onMounted(() => {
  if (!rootRef.value) {
    return
  }

  editorView = new EditorView({
    state: createEditorState(),
    parent: rootRef.value
  })

  if (props.validators.length) {
    forceLinting(editorView)
  } else {
    emitCleanValidationReport()
  }
})

onBeforeUnmount(() => {
  validationRunId += 1
  editorView?.destroy()
  editorView = null
})

watch(
  () => props.modelValue,
  (next) => {
    if (!editorView) {
      return
    }

    const current = editorView.state.doc.toString()
    if (next === current) {
      return
    }

    editorView.dispatch({
      changes: {
        from: 0,
        to: current.length,
        insert: next
      }
    })
  }
)

watch(
  () => props.language,
  (next) => {
    if (!editorView) {
      return
    }

    editorView.dispatch({
      effects: languageCompartment.reconfigure(resolveLanguageExtension(next))
    })

    if (props.validators.length) {
      forceLinting(editorView)
    }
  }
)

watch(
  () => [props.enhanced, props.lineNumbers, props.wordWrap, props.readonly, props.placeholder],
  () => {
    if (!editorView) {
      return
    }

    editorView.dispatch({
      effects: featureCompartment.reconfigure(createFeatureExtensions())
    })
  }
)

watch(
  () => [props.validators, props.validationDebounce] as const,
  () => {
    if (!editorView) {
      return
    }

    validationRunId += 1

    editorView.dispatch({
      effects: validationCompartment.reconfigure(createValidationExtensions())
    })

    if (props.validators.length) {
      forceLinting(editorView)
    } else {
      emitCleanValidationReport()
    }
  }
)
</script>

<template>
  <div ref="rootRef" class="code-editor" :style="cssVars" :data-readonly="readonly ? 'true' : 'false'" />
</template>

<style scoped>
.code-editor {
  --code-editor-min-height: 240px;
  --code-editor-max-height: none;
  width: 100%;
  border-radius: 12px;
  transition: box-shadow 200ms ease;
}

.code-editor :deep(.cm-editor) {
  border-radius: 12px;
  overflow: hidden;
}

.code-editor :deep(.cm-content) {
  max-height: var(--code-editor-max-height);
  min-height: var(--code-editor-min-height);
}

.code-editor :deep(.cm-scroller) {
  overflow: auto;
}

.code-editor[data-readonly='true'] :deep(.cm-editor) {
  background-color: rgb(255 255 255 / 64%);
}
</style>
