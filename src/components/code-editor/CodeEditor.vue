<script setup lang="ts">
import { forceLinting, linter } from '@codemirror/lint'
import { Compartment, EditorState } from '@codemirror/state'
import { EditorView, tooltips, type ViewUpdate } from '@codemirror/view'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createDiagnosticHoverTooltipExtension } from '@/components/code-editor/diagnostic-tooltip'
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
    tooltips({ position: 'absolute' }),
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
        delay: Math.max(0, props.validationDebounce),
        // Use custom hover tooltip extension so diagnostics are anchored to diagnostic range.
        tooltipFilter: () => []
      }
    ),
    createDiagnosticHoverTooltipExtension()
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
  overflow: visible;
}

.code-editor :deep(.cm-content) {
  max-height: var(--code-editor-max-height);
  min-height: var(--code-editor-min-height);
}

.code-editor :deep(.cm-scroller) {
  overflow: auto;
  border-radius: 12px;
}

.code-editor[data-readonly='true'] :deep(.cm-editor) {
  background-color: rgb(255 255 255 / 64%);
}

.code-editor :deep(.cm-tooltip-lint-compact) {
  z-index: 40;
  max-width: min(320px, calc(100vw - 56px));
  border: 1px solid rgb(203 213 225 / 66%);
  border-radius: 9px;
  box-shadow: 0 8px 18px rgb(15 23 42 / 12%);
  background: rgb(255 255 255 / 78%);
  color: #0f172a;
  font-size: 11px;
  line-height: 1.35;
  backdrop-filter: blur(10px);
}

.code-editor :deep(.cm-tooltip-lint-compact .cm-code-tooltip-list) {
  margin: 0;
  padding: 0;
  list-style: none;
}

.code-editor :deep(.cm-tooltip-lint-compact .cm-code-tooltip-item) {
  display: grid;
  gap: 3px;
  padding: 6px 8px;
}

.code-editor :deep(.cm-tooltip-lint-compact .cm-code-tooltip-item + .cm-code-tooltip-item) {
  border-top: 1px solid rgb(226 232 240 / 90%);
}

.code-editor :deep(.cm-tooltip-lint-compact .cm-code-tooltip-meta) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 9.5px;
  color: #64748b;
}

.code-editor :deep(.cm-tooltip-lint-compact .cm-code-tooltip-severity) {
  font-weight: 600;
  letter-spacing: 0.01em;
}

.code-editor :deep(.cm-tooltip-lint-compact .cm-code-tooltip-item--error .cm-code-tooltip-severity) {
  color: #dc2626;
}

.code-editor :deep(.cm-tooltip-lint-compact .cm-code-tooltip-item--warning .cm-code-tooltip-severity) {
  color: #d97706;
}

.code-editor :deep(.cm-tooltip-lint-compact .cm-code-tooltip-item--info .cm-code-tooltip-severity),
.code-editor :deep(.cm-tooltip-lint-compact .cm-code-tooltip-item--hint .cm-code-tooltip-severity) {
  color: #2563eb;
}

.code-editor :deep(.cm-tooltip-lint-compact .cm-code-tooltip-source) {
  color: #64748b;
}

.code-editor :deep(.cm-tooltip-lint-compact .cm-code-tooltip-message) {
  font-size: 10.5px;
  white-space: pre-wrap;
  word-break: break-word;
  color: #0f172a;
}
</style>
