import { autocompletion, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { bracketMatching, foldGutter, foldKeymap, indentOnInput } from '@codemirror/language'
import { EditorState, type Extension } from '@codemirror/state'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  placeholder,
  rectangularSelection
} from '@codemirror/view'

export interface EditorFeatureOptions {
  enhanced: boolean
  lineNumbers: boolean
  wordWrap: boolean
  readonly: boolean
  placeholderText?: string
}

export function createEditorFeatureExtensions(options: EditorFeatureOptions): Extension[] {
  const sharedExtensions: Extension[] = [
    highlightSpecialChars(),
    history(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    highlightActiveLine(),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...closeBracketsKeymap,
      ...searchKeymap,
      indentWithTab
    ])
  ]

  if (options.lineNumbers) {
    sharedExtensions.push(lineNumbers(), highlightActiveLineGutter())
  }

  if (options.enhanced) {
    sharedExtensions.push(foldGutter(), highlightSelectionMatches(), rectangularSelection(), crosshairCursor())
  }

  if (options.wordWrap) {
    sharedExtensions.push(EditorView.lineWrapping)
  }

  if (options.placeholderText) {
    sharedExtensions.push(placeholder(options.placeholderText))
  }

  sharedExtensions.push(EditorState.readOnly.of(options.readonly), EditorView.editable.of(!options.readonly))

  return sharedExtensions
}
