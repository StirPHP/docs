# In the browser

The same language server runs in a browser, compiled to WebAssembly in a Web Worker. It answers the same, from files the
page hands it instead of a disk, but without PHPStan. [The editor on this site](/editor) is built on it.

## The package

It's `editors/web` in the [core repository](https://github.com/StirPHP/core/tree/main/editors/web), built with
`just web` (which needs `wasm-pack` and Rust's `wasm32-unknown-unknown` target). It isn't on npm. `startWorker()` starts
the server in a module worker, and it speaks the Language Server Protocol over `postMessage`, so any LSP client in a page
can use it:

```js
import { startWorker } from 'stirphp-web'
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-jsonrpc/browser'

const worker = startWorker()
const reader = new BrowserMessageReader(worker)
const writer = new BrowserMessageWriter(worker)
```

There's no disk. The project's files go in `initializationOptions.files`, a map from an absolute path (or a `file://`
URI) to its text, and the workspace folder is the root URI as usual:

```js
initializationOptions: {
  files: {
    '/project/composer.json': '{"require": {"php": "^8.2"}}',
    '/project/stirphp.neon': 'parameters:\n    stirphp:\n        rules: [rules/no_var_dump.rhai]\n',
    '/project/rules/no_var_dump.rhai': '...',
    '/project/src/User.php': '<?php ...',
  },
},
```

They're loaded as a project on disk is: `stirphp.neon` or `phpstan.neon` and what they include, Composer's files and the
`vendor/` they describe, the PHP version, baselines, frameworks. Workspace-wide answers (references, rename, workspace
symbols, implementations, changing a signature) see all of them, open or not.

- The `stirphp/setFiles` notification changes them afterwards, with the same map; `null` deletes a file. A change to a
  configuration or Composer's files loads the project again. A document open in the editor keeps the editor's text, and
  goes back to the page's when it's closed.
- `stirphp/fileText` with `{uri}` answers the text of any file the server has, for opening a definition in `vendor/` or in
  PHP's own stubs, whose URIs are `stirphp:///stubs/...`.
- `stirphp/memory` answers `{bytes}`, the size of the WebAssembly memory.

A project's [rules](/guide/rules) run without asking, since the page chose to load them, in the same sandbox as on the
command line, except that calls can only go 16 deep instead of 64. `initializationOptions.workspaceTrusted: false` keeps
them off. PHPStan doesn't run, files aren't watched (the page says what changed), and nothing is read from or written to a
disk.

The worker has one thread, so the server works in small steps, letting go of the thread in between: the notifications
that came in and at most one request, or the diagnostics of one file. Edits are applied as they arrive; diagnostics wait
until they've stopped for 150 ms, the file being edited first.

## How this site's editor is built

- **Monaco**, with only the parts an editor of PHP needs: the editor and its contributions, and Monarch grammars for
  highlighting before the server answers and for files other than PHP. Not Monaco's own language services, its diff
  editor or its built-in LSP client.
- **A small LSP client** of its own (`.vitepress/theme/editor/session.ts` in the
  [docs repository](https://github.com/StirPHP/docs)), over `vscode-jsonrpc`'s `BrowserMessageReader` and
  `BrowserMessageWriter`, turning Monaco's providers into requests: diagnostics, hover, completion with its `use` lines,
  signature help, definitions (into PHP's stubs too, through `stirphp/fileText`), references, highlights, rename, inlay
  hints, semantic tokens, formatting, code actions with their resolution and commands, symbols, folding and selection
  ranges.
- **Every file of the project is in the page.** A workspace edit, such as a rename or a change of signature, applies to
  each file it names, open or not, and what changes in a file that isn't open goes to the server with `stirphp/setFiles`.
  That's why it doesn't use `monaco-languageclient`, which brings much of VS Code with it and, in its editor-service mode,
  refuses edits to files that aren't open; and why it doesn't use Monaco's own LSP client, which can't hand the server the
  project's files.
- **Lazy:** nothing of the editor or the server is loaded until this page is opened; then Monaco loads, and the worker
  fetches the WebAssembly.

## Size and speed

<!--@include: ./parts/browser-measurements.md-->
