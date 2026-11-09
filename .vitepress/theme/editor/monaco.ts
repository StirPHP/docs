// Monaco, with what this editor uses of it and nothing more: the editor's API and contributions
// (not its own language services, diff editor or LSP client), and Monarch grammars for the files a
// sample project has. Loaded only by the editor page, when it starts.

import * as monaco from 'monaco-editor/editor/editor.api'
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'

import 'monaco-editor/editor/contrib/anchorSelect/browser/anchorSelect'
import 'monaco-editor/editor/contrib/bracketMatching/browser/bracketMatching'
import 'monaco-editor/editor/contrib/caretOperations/browser/transpose'
import 'monaco-editor/editor/contrib/caretOperations/browser/caretOperations'
import 'monaco-editor/editor/contrib/clipboard/browser/clipboard'
import 'monaco-editor/editor/contrib/codeAction/browser/codeActionContributions'
import 'monaco-editor/editor/browser/widget/codeEditor/codeEditorWidget'
import 'monaco-editor/features/codicon/register'
import 'monaco-editor/editor/contrib/comment/browser/comment'
import 'monaco-editor/editor/contrib/contextmenu/browser/contextmenu'
import 'monaco-editor/editor/contrib/cursorUndo/browser/cursorUndo'
import 'monaco-editor/editor/contrib/documentSymbols/browser/documentSymbols'
import 'monaco-editor/features/find/register'
import 'monaco-editor/editor/contrib/find/browser/findController'
import 'monaco-editor/editor/contrib/folding/browser/folding'
import 'monaco-editor/editor/contrib/format/browser/formatActions'
import 'monaco-editor/editor/contrib/gotoError/browser/gotoError'
import 'monaco-editor/editor/contrib/gotoError/browser/markerSelectionStatus'
import 'monaco-editor/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess'
import 'monaco-editor/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess'
import 'monaco-editor/editor/standalone/browser/quickAccess/standaloneHelpQuickAccess'
import 'monaco-editor/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess'
import 'monaco-editor/editor/contrib/gotoSymbol/browser/link/goToDefinitionAtPosition'
import 'monaco-editor/editor/contrib/gotoSymbol/browser/goToCommands'
import 'monaco-editor/editor/contrib/hover/browser/hoverContribution'
import 'monaco-editor/editor/contrib/indentation/browser/indentation'
import 'monaco-editor/editor/contrib/inlayHints/browser/inlayHintsContribution'
import 'monaco-editor/editor/contrib/inlineProgress/browser/inlineProgress'
import 'monaco-editor/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard'
import 'monaco-editor/editor/contrib/lineSelection/browser/lineSelection'
import 'monaco-editor/editor/contrib/linesOperations/browser/linesOperations'
import 'monaco-editor/editor/contrib/links/browser/links'
import 'monaco-editor/editor/contrib/multicursor/browser/multicursor'
import 'monaco-editor/editor/contrib/parameterHints/browser/parameterHints'
import 'monaco-editor/editor/contrib/readOnlyMessage/browser/contribution'
import 'monaco-editor/editor/standalone/browser/referenceSearch/standaloneReferenceSearch'
import 'monaco-editor/editor/contrib/rename/browser/rename'
import 'monaco-editor/editor/contrib/semanticTokens/browser/documentSemanticTokens'
import 'monaco-editor/editor/contrib/semanticTokens/browser/viewportSemanticTokens'
import 'monaco-editor/editor/contrib/smartSelect/browser/smartSelect'
import 'monaco-editor/editor/contrib/snippet/browser/snippetController2'
import 'monaco-editor/editor/contrib/suggest/browser/suggestController'
import 'monaco-editor/editor/contrib/suggest/browser/suggestInlineCompletions'
import 'monaco-editor/editor/contrib/tokenization/browser/tokenization'
import 'monaco-editor/editor/contrib/wordHighlighter/browser/wordHighlighter'
import 'monaco-editor/editor/contrib/wordOperations/browser/wordOperations'
import 'monaco-editor/editor/contrib/wordPartOperations/browser/wordPartOperations'
import 'monaco-editor/editor/browser/coreCommands'
import 'monaco-editor/editor/common/standaloneStrings'

import 'monaco-editor/languages/definitions/php/register'
import 'monaco-editor/languages/definitions/yaml/register'
import 'monaco-editor/languages/definitions/rust/register'
import 'monaco-editor/languages/definitions/javascript/register'
import 'monaco-editor/languages/definitions/markdown/register'

;(self as any).MonacoEnvironment = { getWorker: () => new EditorWorker() }

// Blade, as Laravel's compiler finds it: a name it doesn't know stays HTML, and `foo@if.com` isn't a
// directive. The server's semantic tokens come over this once it has answered.
const WITH_ARGUMENTS = (
  'auth aware bool break can canany cannot case checked choice class component componentfirst context continue dd ' +
  'disabled dump each elseauth elsecan elsecanany elsecannot elseguest elseif elsepush elsepushif empty env error ' +
  'extends extendsfirst fonts for foreach forelse fragment guest hassection hasstack if include includefirst ' +
  'includeif includeisolated includeunless includewhen inject isset js json lang method once php prepend ' +
  'prependonce props push pushif pushonce readonly required section sectionmissing selected session slot stack ' +
  'style switch unless unset vite while yield'
).split(' ').map((name) => `@${name}`)
const WITHOUT_ARGUMENTS = (
  'append csrf default else endauth endcan endcanany endcannot endcomponent endcomponentclass endcomponentfirst ' +
  'endcontext endempty endenv enderror endfor endforeach endforelse endfragment endguest endif endisset endlang ' +
  'endonce endprepend endprependonce endproduction endpush endpushif endpushonce endsection endsession endslot ' +
  'endswitch endunless endwhile overwrite parent production show stop use vitereactrefresh'
).split(' ').map((name) => `@${name}`)
// A `@name` in a Monarch regular expression is one of the language's attributes, so `[@]` is an at sign.
const ATTRIBUTE = /[\w.:@%-]+/

const blade: monaco.languages.IMonarchLanguage = {
  ignoreCase: true,
  withArguments: WITH_ARGUMENTS,
  directives: [...WITH_ARGUMENTS, ...WITHOUT_ARGUMENTS],
  phpKeywords: (
    'abstract and array as break callable case catch class clone const continue declare default do echo else elseif ' +
    'empty enddeclare endfor endforeach endif endswitch endwhile enum extends false final finally fn for foreach ' +
    'function global goto if implements include include_once instanceof insteadof interface isset list match ' +
    'namespace new null or print private protected public readonly require require_once return self static switch ' +
    'throw trait true try unset use var while xor yield'
  ).split(' '),
  tokenizer: {
    root: [
      { include: '@blade' },
      [/(<\/\s*)(x[-:][\w.:-]*)(\s*>)/, ['delimiter.html', 'tag.component', 'delimiter.html']],
      [/(<\s*)(x[-:][\w.:-]*)/, ['delimiter.html', 'tag.component'], '@component'],
      [/<!--/, 'comment.html', '@htmlComment'],
      [/<!doctype[^>]*>/, 'metatag.html'],
      [/(<)(script)\b/, ['delimiter.html', { token: 'tag', next: '@htmlTag.text' }]],
      [/(<)(style)\b/, ['delimiter.html', { token: 'tag', next: '@htmlTag.text' }]],
      [/(<\/?)([a-z][\w:-]*)/, ['delimiter.html', { token: 'tag', next: '@htmlTag' }]],
      [/\w+(@[\w.-]*)?/, ''],
    ],
    // what Blade finds wherever it is, in HTML's text, attributes and comments too
    blade: [
      [/\{\{--/, 'comment.blade', '@bladeComment'],
      [/@@\w*/, ''],
      [/@\{\{|@\{!!/, ''],
      [/[@]verbatim\b/, 'keyword.blade', '@verbatim'],
      [/[@]php\b(?![ \t]*\()/, 'keyword.blade', '@phpBlock'],
      [/<\?(php|=)?/, 'metatag.php', '@phpTag'],
      [/\{!!/, 'delimiter.blade', '@rawEcho'],
      [/\{\{\{?/, 'delimiter.blade', '@echo'],
      [/[@]use(?=[ \t]*\()/, 'keyword.blade', '@useOpen'],
      [
        /@[a-z]+(?=[ \t]*\()/,
        { cases: { '@withArguments': { token: 'keyword.blade', next: '@argumentsOpen' }, '@directives': 'keyword.blade', '@default': '' } },
      ],
      [/@[a-z]+/, { cases: { '@directives': 'keyword.blade', '@default': '' } }],
    ],
    bladeComment: [
      [/--\}\}/, 'comment.blade', '@pop'],
      [/./, 'comment.blade'],
    ],
    verbatim: [
      [/[@]endverbatim\b/, 'keyword.blade', '@pop'],
      [/./, ''],
    ],
    php: [
      [/\$\w+/, 'variable.php'],
      [/'/, 'string.php', '@phpSingleQuote'],
      [/"/, 'string.php', '@phpDoubleQuote'],
      [/\d[\d_]*(\.\d+)?/, 'number.php'],
      [/[a-z_\\][\w\\]*/, { cases: { '@phpKeywords': 'keyword.php', '@default': '' } }],
    ],
    phpComments: [
      [/\/\*/, 'comment.php', '@phpBlockComment'],
      [/(\/\/|#(?!\[)).*$/, 'comment.php'],
    ],
    phpSingleQuote: [
      [/\\./, 'string.php'],
      [/'/, 'string.php', '@pop'],
      [/./, 'string.php'],
    ],
    phpDoubleQuote: [
      [/\\./, 'string.php'],
      [/"/, 'string.php', '@pop'],
      [/\$\w+/, 'variable.php'],
      [/./, 'string.php'],
    ],
    phpBlockComment: [
      [/\*\//, 'comment.php', '@pop'],
      [/./, 'comment.php'],
    ],
    echo: [[/\}\}\}?/, 'delimiter.blade', '@pop'], { include: '@php' }],
    rawEcho: [[/!!\}/, 'delimiter.blade', '@pop'], { include: '@php' }],
    phpBlock: [[/[@]endphp\b/, 'keyword.blade', '@pop'], { include: '@phpComments' }, { include: '@php' }],
    phpTag: [[/\?>/, 'metatag.php', '@pop'], { include: '@phpComments' }, { include: '@php' }],
    argumentsOpen: [[/[ \t]*\(/, { token: 'delimiter.blade', switchTo: '@arguments' }]],
    arguments: [[/\)/, 'delimiter.blade', '@pop'], [/\(/, '', '@parentheses'], { include: '@php' }],
    parentheses: [[/\)/, '', '@pop'], [/\(/, '', '@parentheses'], { include: '@php' }],
    useOpen: [[/[ \t]*\(/, { token: 'delimiter.blade', switchTo: '@useArguments' }]],
    useArguments: [
      [/\)/, 'delimiter.blade', '@pop'],
      [/[^)]+/, 'string.blade'],
    ],
    htmlComment: [[/-->/, 'comment.html', '@pop'], { include: '@blade' }, [/./, 'comment.html']],
    // `$S2` is `text` for a `<script>` or `<style>`, whose text isn't more tags
    htmlTag: [
      [/\/>/, 'delimiter.html', '@pop'],
      [/>/, { cases: { '$S2==text': { token: 'delimiter.html', switchTo: '@rawText' }, '@default': { token: 'delimiter.html', next: '@pop' } } }],
      { include: '@blade' },
      [ATTRIBUTE, 'attribute.name'],
      [/=/, 'delimiter.html'],
      [/"/, 'attribute.value', '@attributeDouble'],
      [/'/, 'attribute.value', '@attributeSingle'],
    ],
    rawText: [
      [/<\/(script|style)\s*>/, 'delimiter.html', '@pop'],
      { include: '@blade' },
    ],
    attributeDouble: [[/"/, 'attribute.value', '@pop'], { include: '@blade' }, [/./, 'attribute.value']],
    attributeSingle: [[/'/, 'attribute.value', '@pop'], { include: '@blade' }, [/./, 'attribute.value']],
    component: [
      [/\/?>/, 'delimiter.html', '@pop'],
      { include: '@blade' },
      [/::[\w.:@%-]+/, 'attribute.name'],
      [/(:[\w.:@%-]+)(\s*=\s*)(")/, ['attribute.name', 'delimiter.html', { token: 'delimiter.blade', next: '@boundDouble' }]],
      [/(:[\w.:@%-]+)(\s*=\s*)(')/, ['attribute.name', 'delimiter.html', { token: 'delimiter.blade', next: '@boundSingle' }]],
      [/(:)(\$\w+)/, ['attribute.name', 'variable.php']],
      [ATTRIBUTE, 'attribute.name'],
      [/=/, 'delimiter.html'],
      [/"/, 'attribute.value', '@attributeDouble'],
      [/'/, 'attribute.value', '@attributeSingle'],
    ],
    boundDouble: [[/"/, 'delimiter.blade', '@pop'], { include: '@php' }],
    boundSingle: [[/'/, 'delimiter.blade', '@pop'], { include: '@php' }],
  },
}

monaco.languages.register({ id: 'blade', extensions: ['.blade.php'], aliases: ['Blade'] })
monaco.languages.setMonarchTokensProvider('blade', blade)
monaco.languages.setLanguageConfiguration('blade', {
  comments: { blockComment: ['{{--', '--}}'] },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"', notIn: ['string'] },
    { open: "'", close: "'", notIn: ['string', 'comment'] },
  ],
})

/** The Monaco language of a file, by its name. */
export function languageOf(path: string): string {
  if (path.endsWith('.blade.php')) return 'blade'
  if (path.endsWith('.php')) return 'php'
  if (path.endsWith('.neon')) return 'yaml'
  if (path.endsWith('.rhai')) return 'rust'
  if (path.endsWith('.json')) return 'javascript'
  if (path.endsWith('.md')) return 'markdown'
  return 'plaintext'
}

export { monaco }
