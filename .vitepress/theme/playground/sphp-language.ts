import type * as Monaco from 'monaco-editor/editor/editor.api'

/** StirPHP for Monaco: a Monarch tokenizer and the site's colors. */
export function registerSphp(monaco: typeof Monaco) {
  monaco.languages.register({ id: 'sphp', extensions: ['.sphp'], aliases: ['StirPHP'] })

  monaco.languages.setLanguageConfiguration('sphp', {
    comments: { lineComment: '//', blockComment: ['/*', '*/'] },
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
    wordPattern: /\$?[A-Za-z_\x80-\uffff][\w\x80-\uffff]*/,
  })

  monaco.languages.setMonarchTokensProvider('sphp', {
    keywords: [
      'if', 'else', 'elseif', 'when', 'match', 'for', 'foreach', 'while', 'do', 'switch', 'case', 'default',
      'return', 'throw', 'try', 'catch', 'finally', 'break', 'continue', 'yield', 'as', 'is', 'in', 'of',
      'where', 'new', 'clone', 'instanceof', 'namespace', 'use', 'echo', 'print',
    ],
    storage: [
      'val', 'var', 'mut', 'function', 'fn', 'class', 'interface', 'trait', 'enum', 'record', 'typealias',
      'data', 'sealed', 'open', 'abstract', 'final', 'override', 'private', 'protected', 'public', 'static',
      'readonly', 'const', 'out',
    ],
    constants: ['true', 'false', 'null', 'this', 'it'],
    builtinTypes: [
      'Int', 'Float', 'String', 'Bool', 'Unit', 'Nothing', 'List', 'MutableList', 'Map', 'MutableMap',
      'int', 'float', 'string', 'bool', 'void', 'never', 'mixed', 'array', 'object', 'iterable', 'callable',
    ],
    tokenizer: {
      root: [
        [/\/\*\*/, 'comment.doc', '@doc'],
        [/\/\*/, 'comment', '@block'],
        [/\/\/.*$/, 'comment'],
        [/#(?!\[).*$/, 'comment'],
        [/"/, 'string', '@dstring'],
        [/'/, 'string', '@sstring'],
        [/\$this\b/, 'constant'],
        [/\$[A-Za-z_][\w]*/, 'variable.mutable'],
        [/\b(function)(\s+)([A-Za-z_]\w*)(?=\s*\()/, ['keyword.storage', '', 'function']],
        [/\b(class|interface|trait|enum|record|typealias)(\s+)([A-Za-z_]\w*)/, ['keyword.storage', '', 'type']],
        [
          /[A-Za-z_]\w*/,
          {
            cases: {
              '@keywords': 'keyword',
              '@storage': 'keyword.storage',
              '@constants': 'constant',
              '@builtinTypes': 'type.builtin',
              '[A-Z][\\w]*': 'type',
              '@default': 'identifier',
            },
          },
        ],
        [/\b0[xX][\da-fA-F_]+\b|\b\d[\d_]*(\.\d+)?([eE][+-]?\d+)?\b/, 'number'],
        [/\?->|!!|\?:|\?\?=?/, 'operator.null'],
        [/->|::/, 'delimiter'],
        [/[{}()[\]]/, '@brackets'],
        [/[=<>!+\-*/%&|^~.?:,;]/, 'operator'],
      ],
      dstring: [
        [/\$\{/, { token: 'delimiter.interp', next: '@interp' }],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
        [/[^"\\$]+/, 'string'],
        [/\$/, 'string'],
      ],
      sstring: [
        [/\\['\\]/, 'string.escape'],
        [/'/, 'string', '@pop'],
        [/[^'\\]+/, 'string'],
        [/\\/, 'string'],
      ],
      interp: [
        [/\}/, { token: 'delimiter.interp', next: '@pop' }],
        { include: 'root' },
      ],
      doc: [
        [/\*\//, 'comment.doc', '@pop'],
        [/@[\w-]+/, 'comment.doc.tag'],
        [/[^*@]+/, 'comment.doc'],
        [/./, 'comment.doc'],
      ],
      block: [
        [/\*\//, 'comment', '@pop'],
        [/[^*]+/, 'comment'],
        [/./, 'comment'],
      ],
    },
  } as Monaco.languages.IMonarchLanguage)

  const rules = (dark: boolean): Monaco.editor.ITokenThemeRule[] => [
    { token: 'comment', foreground: dark ? '8f7f8a' : '817b7e', fontStyle: 'italic' },
    { token: 'comment.doc.tag', foreground: dark ? 'ff9cbf' : 'ac003d' },
    { token: 'keyword', foreground: dark ? 'ff78a8' : 'ce0049' },
    { token: 'keyword.storage', foreground: dark ? 'ff78a8' : 'ce0049' },
    { token: 'constant', foreground: dark ? '79b8ff' : '005cc5' },
    { token: 'type', foreground: dark ? 'e8b2c7' : '9b1544' },
    { token: 'type.builtin', foreground: dark ? '79b8ff' : '005cc5' },
    { token: 'function', foreground: dark ? 'f5c2e7' : '6f42c1' },
    { token: 'variable.mutable', foreground: dark ? 'ffab70' : 'e36209' },
    { token: 'string', foreground: dark ? '9ecbff' : '032f62' },
    { token: 'string.escape', foreground: dark ? '79b8ff' : '005cc5' },
    { token: 'delimiter.interp', foreground: dark ? 'ff78a8' : 'ce0049' },
    { token: 'number', foreground: dark ? '79b8ff' : '005cc5' },
    { token: 'operator.null', foreground: dark ? 'ff78a8' : 'ce0049' },
  ]

  monaco.editor.defineTheme('stir-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: rules(true),
    colors: {
      'editor.background': '#211a20',
      'editor.foreground': '#f5eef3',
      'editorLineNumber.foreground': '#76616d',
      'editorLineNumber.activeForeground': '#d3c5ce',
      'editor.lineHighlightBackground': '#2a2028',
      'editor.selectionBackground': '#5a2a45',
      'editorCursor.foreground': '#ff78a8',
      'editorWidget.background': '#211a20',
      'editorWidget.border': '#49343f',
      'editorHoverWidget.background': '#211a20',
      'editorHoverWidget.border': '#49343f',
      'editorSuggestWidget.background': '#211a20',
      'editorSuggestWidget.border': '#49343f',
      'editorSuggestWidget.selectedBackground': '#3c2030',
    },
  })
  monaco.editor.defineTheme('stir-light', {
    base: 'vs',
    inherit: true,
    rules: rules(false),
    colors: {
      'editor.background': '#fbf7f9',
      'editor.foreground': '#080808',
      'editorLineNumber.foreground': '#bcb8ba',
      'editorLineNumber.activeForeground': '#534c50',
      'editor.lineHighlightBackground': '#f6edf1',
      'editor.selectionBackground': '#faeaf0',
      'editorCursor.foreground': '#ce0049',
      'editorHoverWidget.background': '#ffffff',
      'editorHoverWidget.border': '#e5d6df',
      'editorSuggestWidget.selectedBackground': '#faeaf0',
    },
  })
}
