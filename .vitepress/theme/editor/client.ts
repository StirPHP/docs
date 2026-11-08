// Everything the editor page loads when it starts: Monaco, the session with the language server,
// the sample projects and the editor's colours. One dynamic import, so none of it is in the rest
// of the site.

import type * as Monaco from 'monaco-editor'
import { languageOf, monaco } from './monaco'
import { SAMPLES, sampleFiles, withChoices } from './samples'
import { ROOT, Session, pathOf, uriOf, type Problem, type SessionEvents } from './session'

export { monaco, languageOf, SAMPLES, sampleFiles, withChoices, ROOT, Session, pathOf, uriOf }
export type { Problem, SessionEvents }

/** The colours of the site's code blocks, and of what the language server marks. */
function defineThemes(): void {
  const rules = (dark: boolean): Monaco.editor.ITokenThemeRule[] => {
    const c = dark
      ? { type: 'ffa657', fn: 'd2a8ff', prop: '79c0ff', kw: 'ff7b72', comment: '8b949e', str: 'a5d6ff', num: '79c0ff', ns: 'd2a8ff', v: 'e6edf3', param: 'ffa198' }
      : { type: '953800', fn: '8250df', prop: '0550ae', kw: 'cf222e', comment: '6e7781', str: '0a3069', num: '0550ae', ns: '6639ba', v: '1f2328', param: '953800' }
    return [
      // what the server marks: its legend's types, and `type.modifier`
      { token: 'namespace', foreground: c.ns },
      { token: 'type', foreground: c.type },
      { token: 'class', foreground: c.type },
      { token: 'enum', foreground: c.type },
      { token: 'interface', foreground: c.type, fontStyle: 'italic' },
      { token: 'typeParameter', foreground: c.type, fontStyle: 'italic' },
      { token: 'parameter', foreground: c.param },
      { token: 'variable', foreground: c.v },
      { token: 'variable.readonly', foreground: c.prop },
      { token: 'property', foreground: c.prop },
      { token: 'enumMember', foreground: c.prop },
      { token: 'function', foreground: c.fn },
      { token: 'method', foreground: c.fn },
      { token: 'keyword', foreground: c.kw },
      { token: 'comment', foreground: c.comment, fontStyle: 'italic' },
      { token: 'string', foreground: c.str },
      { token: 'number', foreground: c.num },
      // Monarch's, before the server has answered, and for other files
      { token: 'variable.php', foreground: c.v },
      { token: 'keyword.php', foreground: c.kw },
      { token: 'string.php', foreground: c.str },
      { token: 'comment.php', foreground: c.comment, fontStyle: 'italic' },
      { token: 'number.php', foreground: c.num },
      { token: 'metatag.php', foreground: c.kw },
    ]
  }
  monaco.editor.defineTheme('stir-light', {
    base: 'vs',
    inherit: true,
    rules: rules(false),
    colors: {
      'editor.background': '#fbf7f9',
      'editorGutter.background': '#fbf7f9',
      'editor.lineHighlightBackground': '#f6edf1',
      'editorLineNumber.foreground': '#a59ba0',
      'editorInlayHint.background': '#f3e6ec',
      'editorInlayHint.foreground': '#7b6d74',
    },
  })
  monaco.editor.defineTheme('stir-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: rules(true),
    colors: {
      'editor.background': '#211a20',
      'editorGutter.background': '#211a20',
      'editor.lineHighlightBackground': '#2a2028',
      'editorLineNumber.foreground': '#76616d',
      'editorInlayHint.background': '#35222d',
      'editorInlayHint.foreground': '#c4b2bd',
      'editorWidget.background': '#2a2028',
      'editorHoverWidget.background': '#2a2028',
      'editorSuggestWidget.background': '#2a2028',
    },
  })
}
defineThemes()
