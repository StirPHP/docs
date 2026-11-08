// The editor's side of the Language Server Protocol: StirPHP's language server runs in a Web
// Worker (`startWorker()` of `stirphp-web`), and this speaks LSP to it with vscode-jsonrpc, turning
// what Monaco asks into requests and what the server says into markers, edits and widgets.
//
// Why not a ready-made client: monaco-languageclient brings VS Code's workbench (several MB more
// to download), and in its editor-service mode it refuses edits to files that aren't open, which a
// rename across files needs. Monaco's own `lsp` client can't pass `initializationOptions` (the
// project's files), a workspace folder, or this server's own requests. Here, every file of the
// project is in the page, so a model can be made for any of them, and a workspace edit applies to
// whichever files it names, open or not.

import type * as Monaco from 'monaco-editor'
import { startWorker } from 'stirphp-web'
import {
  BrowserMessageReader,
  BrowserMessageWriter,
  CancellationTokenSource,
  createProtocolConnection,
  type ProtocolConnection,
} from 'vscode-languageserver-protocol/browser'
import type * as L from 'vscode-languageserver-protocol'
import { languageOf, monaco } from './monaco'

export const ROOT = '/project'
const ROOT_URI = `file://${ROOT}`

export type Files = Record<string, string>

export interface Problem {
  path: string
  line: number
  column: number
  severity: 'error' | 'warning' | 'info' | 'hint'
  code: string
  message: string
}

export interface SessionEvents {
  /** The diagnostics changed. */
  problems(): void
  /** The server said something, as `window/showMessage` does. */
  message(type: number, text: string): void
  /** A file of the project should be shown, at a place. */
  show(path: string, selection?: Monaco.IRange): void
  /** Asks the person something; `null` if they didn't answer. */
  ask(title: string, prompt: string, placeholder: string): Promise<string | null>
  /** The project's files changed, other than by typing in the file shown. */
  files(): void
}

/** `/project/src/A.php` from `file:///project/src/A.php`; `null` for what isn't a file. */
export function pathOf(uri: string): string | null {
  if (!uri.startsWith('file://')) return null
  return decodeURIComponent(uri.slice('file://'.length))
}

export function uriOf(path: string): string {
  return 'file://' + path.split('/').map(encodeURIComponent).join('/')
}

const SEVERITY: Record<number, Problem['severity']> = { 1: 'error', 2: 'warning', 3: 'info', 4: 'hint' }

export class Session {
  readonly files: Files
  readonly diagnostics = new Map<string, L.Diagnostic[]>()
  private connection!: ProtocolConnection
  private worker!: Worker
  private capabilities: L.ServerCapabilities = {}
  /** Documents open in the server's sense, with their versions. */
  private open = new Map<string, number>()
  private disposables: Monaco.IDisposable[] = []
  /** What's waiting to go to the server with `stirphp/setFiles`. */
  private pending: Files = {}
  private pendingTimer: ReturnType<typeof setTimeout> | undefined
  private inlayChanged = new monaco.Emitter<void>()
  private tokensChanged = new monaco.Emitter<void>()
  private lspActions = new WeakMap<Monaco.languages.CodeAction, L.CodeAction>()
  readonly started: number = performance.now()
  firstDiagnostics: number | null = null

  constructor(files: Files, private events: SessionEvents) {
    this.files = { ...files }
  }

  /** Starts the server with the project's files, and registers what Monaco asks it. */
  async start(): Promise<L.InitializeResult> {
    this.worker = startWorker()
    const reader = new BrowserMessageReader(this.worker)
    const writer = new BrowserMessageWriter(this.worker)
    this.connection = createProtocolConnection(reader, writer)
    this.listen()
    this.connection.listen()
    const result = await this.connection.sendRequest<L.InitializeResult>('initialize', {
      processId: null,
      rootUri: ROOT_URI,
      workspaceFolders: [{ uri: ROOT_URI, name: 'project' }],
      capabilities: CLIENT_CAPABILITIES,
      initializationOptions: {
        files: this.files,
        clientCommands: ['stirphp.renameAt', 'stirphp.askParameter'],
      },
    } satisfies L.InitializeParams)
    this.capabilities = result.capabilities
    this.connection.sendNotification('initialized', {})
    this.register()
    return result
  }

  dispose(): void {
    clearTimeout(this.pendingTimer)
    for (const d of this.disposables) d.dispose()
    for (const model of monaco.editor.getModels()) model.dispose()
    this.connection?.dispose()
    this.worker?.terminate()
  }

  /** How much memory the server's WebAssembly has. */
  async memory(): Promise<number> {
    const r = await this.connection.sendRequest<{ bytes: number }>('stirphp/memory', {})
    return r.bytes
  }

  // ------------------------------------------------------------------ files and models

  /** The model of a file, made from the project's text, or for a stub from the server's. */
  async model(uri: string): Promise<Monaco.editor.ITextModel | null> {
    const parsed = monaco.Uri.parse(uri)
    const existing = monaco.editor.getModel(parsed)
    if (existing) return existing
    const path = pathOf(uri)
    if (path !== null && path in this.files) return this.makeModel(path)
    // PHP's stubs, `stirphp:///stubs/...`: the server has their text
    const text = await this.connection
      .sendRequest<string | { text: string } | null>('stirphp/fileText', { uri })
      .catch(() => null)
    if (text === null || text === undefined) return null
    const value = typeof text === 'string' ? text : text.text
    return monaco.editor.getModel(parsed) ?? monaco.editor.createModel(value, 'php', parsed)
  }

  /** The model of a project file, made if there's none yet. */
  makeModel(path: string): Monaco.editor.ITextModel {
    const uri = monaco.Uri.parse(uriOf(path))
    const existing = monaco.editor.getModel(uri)
    if (existing) return existing
    const model = monaco.editor.createModel(this.files[path] ?? '', languageOf(path), uri)
    this.mark(model)
    this.disposables.push(model.onDidChangeContent((e) => this.changed(model, e)))
    return model
  }

  isStub(uri: Monaco.Uri): boolean {
    return uri.scheme !== 'file'
  }

  /** The document is shown: it's open for the server, which then has the editor's text. */
  opened(model: Monaco.editor.ITextModel): void {
    const uri = model.uri.toString()
    if (this.open.has(uri) || this.isStub(model.uri) || model.getLanguageId() !== 'php') return
    this.open.set(uri, model.getVersionId())
    const path = pathOf(uri)!
    // what's waiting for it would come after, and win
    delete this.pending[path]
    this.connection.sendNotification('textDocument/didOpen', {
      textDocument: { uri, languageId: 'php', version: model.getVersionId(), text: model.getValue() },
    })
  }

  /** The document isn't shown any more: the server goes back to the page's text, which is this. */
  closed(model: Monaco.editor.ITextModel): void {
    const uri = model.uri.toString()
    if (!this.open.has(uri)) return
    const path = pathOf(uri)!
    this.files[path] = model.getValue()
    this.connection.sendNotification('stirphp/setFiles', { files: { [path]: this.files[path] } })
    this.open.delete(uri)
    this.connection.sendNotification('textDocument/didClose', { textDocument: { uri } })
  }

  private changed(model: Monaco.editor.ITextModel, e: Monaco.editor.IModelContentChangedEvent): void {
    const uri = model.uri.toString()
    const path = pathOf(uri)
    if (path === null) return
    this.files[path] = model.getValue()
    if (this.open.has(uri)) {
      this.open.set(uri, model.getVersionId())
      this.connection.sendNotification('textDocument/didChange', {
        textDocument: { uri, version: model.getVersionId() },
        // in the order they were made, each against the text the one before left
        contentChanges: [...e.changes]
          .sort((a, b) => b.rangeOffset - a.rangeOffset)
          .map((c) => ({ range: lspRange(c.range), rangeLength: c.rangeLength, text: c.text })),
      } satisfies L.DidChangeTextDocumentParams)
    } else {
      this.setFiles({ [path]: this.files[path] })
    }
  }

  /** Changes files of the project on the server's side, as a page does: `null` deletes one. */
  setFiles(files: Record<string, string | null>, now = false): void {
    for (const [path, text] of Object.entries(files)) {
      if (text === null) delete this.files[path]
      else this.files[path] = text
      ;(this.pending as Record<string, string | null>)[path] = text
    }
    clearTimeout(this.pendingTimer)
    const send = () => {
      const files = this.pending
      this.pending = {}
      if (Object.keys(files).length > 0) this.connection.sendNotification('stirphp/setFiles', { files })
    }
    if (now) send()
    else this.pendingTimer = setTimeout(send, 150)
  }

  /** Replaces a file's text, through its model if it has one, so that undo and views follow. */
  replaceFile(path: string, text: string): void {
    const model = monaco.editor.getModel(monaco.Uri.parse(uriOf(path)))
    if (model) {
      model.pushEditOperations([], [{ range: model.getFullModelRange(), text }], () => null)
    } else {
      this.setFiles({ [path]: text }, true)
    }
    this.events.files()
  }

  // ------------------------------------------------------------------ the server's side

  private listen(): void {
    const c = this.connection
    c.onNotification('textDocument/publishDiagnostics', (p: L.PublishDiagnosticsParams) => {
      this.firstDiagnostics ??= performance.now() - this.started
      this.diagnostics.set(p.uri, p.diagnostics)
      const model = monaco.editor.getModel(monaco.Uri.parse(p.uri))
      if (model) this.mark(model)
      this.events.problems()
    })
    c.onNotification('window/showMessage', (p: L.ShowMessageParams) => this.events.message(p.type, p.message))
    c.onNotification('window/logMessage', (p: L.LogMessageParams) => console.debug('[stirphp]', p.message))
    c.onRequest('window/showMessageRequest', async (p: L.ShowMessageRequestParams) => {
      this.events.message(p.type, p.message)
      return p.actions?.[0] ?? null
    })
    c.onRequest('workspace/applyEdit', async (p: L.ApplyWorkspaceEditParams) => {
      const applied = await this.applyEdit(p.edit)
      return { applied } satisfies L.ApplyWorkspaceEditResult
    })
    c.onRequest('workspace/configuration', (p: L.ConfigurationParams) => p.items.map(() => null))
    c.onRequest('window/workDoneProgress/create', () => null)
    c.onRequest('client/registerCapability', () => null)
    c.onRequest('client/unregisterCapability', () => null)
    c.onRequest('workspace/inlayHint/refresh', () => {
      this.inlayChanged.fire()
      return null
    })
    c.onRequest('workspace/semanticTokens/refresh', () => {
      this.tokensChanged.fire()
      return null
    })
    c.onRequest('workspace/diagnostic/refresh', () => null)
    c.onRequest('workspace/codeLens/refresh', () => null)
    c.onNotification('$/progress', () => {})
  }

  /** Markers on a model for what the server said of its file. */
  private mark(model: Monaco.editor.ITextModel): void {
    const diagnostics = this.diagnostics.get(model.uri.toString()) ?? []
    monaco.editor.setModelMarkers(model, 'stirphp', diagnostics.map(markerOf))
  }

  /** Every diagnostic, for the list of problems. */
  problems(): Problem[] {
    const out: Problem[] = []
    for (const [uri, list] of this.diagnostics) {
      const path = pathOf(uri)
      if (path === null) continue
      for (const d of list) {
        // what's only for greying out, such as an unused import
        if (d.severity === 4) continue
        out.push({
          path,
          line: d.range.start.line + 1,
          column: d.range.start.character + 1,
          severity: SEVERITY[d.severity ?? 1] ?? 'error',
          code: d.code === undefined ? '' : String(d.code),
          message: d.message,
        })
      }
    }
    return out.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line || a.column - b.column)
  }

  /** Applies a workspace edit to the files it names, open or not. */
  async applyEdit(edit: L.WorkspaceEdit): Promise<boolean> {
    const converted = await this.workspaceEdit(edit)
    if (converted === null) return false
    const byUri = new Map<string, { model: Monaco.editor.ITextModel; edits: Monaco.editor.IIdentifiedSingleEditOperation[] }>()
    for (const e of converted.edits) {
      if (!('textEdit' in e)) continue
      const model = monaco.editor.getModel(e.resource)
      if (!model) return false
      const entry = byUri.get(model.uri.toString()) ?? { model, edits: [] }
      entry.edits.push({ range: e.textEdit.range, text: e.textEdit.text })
      byUri.set(model.uri.toString(), entry)
    }
    for (const { model, edits } of byUri.values()) {
      model.pushStackElement()
      model.pushEditOperations([], edits, () => null)
      model.pushStackElement()
    }
    this.events.files()
    return true
  }

  /** Monaco's form of a workspace edit, with a model for every file it names. */
  private async workspaceEdit(edit: L.WorkspaceEdit | undefined): Promise<Monaco.languages.WorkspaceEdit | null> {
    if (!edit) return null
    const out: Monaco.languages.IWorkspaceTextEdit[] = []
    const add = async (uri: string, edits: (L.TextEdit | L.AnnotatedTextEdit)[], version: number | null | undefined) => {
      const model = await this.model(uri)
      if (!model) throw new Error(`no file ${uri}`)
      const open = this.open.get(uri)
      if (typeof version === 'number' && open !== undefined && open !== version) {
        throw new Error(`${uri} changed meanwhile`)
      }
      for (const e of edits) {
        out.push({ resource: model.uri, textEdit: { range: monacoRange(e.range), text: e.newText }, versionId: undefined })
      }
    }
    try {
      if (edit.documentChanges) {
        for (const change of edit.documentChanges) {
          if ('textDocument' in change) await add(change.textDocument.uri, change.edits, change.textDocument.version)
          else this.events.message(2, `This edit would ${change.kind} a file, which the editor here can't do.`)
        }
      } else if (edit.changes) {
        for (const [uri, edits] of Object.entries(edit.changes)) await add(uri, edits, undefined)
      }
    } catch (e) {
      this.events.message(2, `The edit wasn't made: ${(e as Error).message}`)
      return null
    }
    return { edits: out }
  }

  // ------------------------------------------------------------------ what Monaco asks

  private params(model: Monaco.editor.ITextModel, position: Monaco.Position): L.TextDocumentPositionParams {
    return { textDocument: { uri: model.uri.toString() }, position: lspPosition(position) }
  }

  private request<R>(method: string, params: unknown, token?: Monaco.CancellationToken): Promise<R | null> {
    const source = new CancellationTokenSource()
    const listening = token?.onCancellationRequested(() => source.cancel())
    return this.connection
      .sendRequest<R>(method, params, source.token)
      .catch((e) => {
        if (!source.token.isCancellationRequested) console.warn(`[stirphp] ${method}:`, e?.message ?? e)
        return null
      })
      .finally(() => {
        listening?.dispose()
        source.dispose()
      })
  }

  /** Locations, with a model for each, so that peeks and jumps can show them. */
  private async locations(result: L.Location | L.Location[] | L.LocationLink[] | null): Promise<Monaco.languages.Location[]> {
    if (!result) return []
    const list = Array.isArray(result) ? result : [result]
    const out: Monaco.languages.Location[] = []
    for (const l of list) {
      const uri = 'targetUri' in l ? l.targetUri : l.uri
      const range = 'targetUri' in l ? l.targetSelectionRange : l.range
      const model = await this.model(uri)
      if (model) out.push({ uri: model.uri, range: monacoRange(range) })
    }
    return out
  }

  private register(): void {
    const caps = this.capabilities
    const L = monaco.languages
    const php = 'php'
    const d = this.disposables

    d.push(
      monaco.editor.registerEditorOpener({
        openCodeEditor: (_source, resource, selection) => {
          const path = pathOf(resource.toString())
          const range =
            selection && 'startLineNumber' in selection
              ? selection
              : selection
                ? new monaco.Range(selection.lineNumber, selection.column, selection.lineNumber, selection.column)
                : undefined
          this.events.show(path ?? resource.toString(), range)
          return true
        },
      }),
    )

    d.push(
      L.registerHoverProvider(php, {
        provideHover: async (model, position, token) => {
          const h = await this.request<L.Hover>('textDocument/hover', this.params(model, position), token)
          if (!h) return null
          return { contents: markdownOf(h.contents), range: h.range ? monacoRange(h.range) : undefined }
        },
      }),
    )

    const completion = caps.completionProvider
    if (completion) {
      d.push(
        L.registerCompletionItemProvider(php, {
          triggerCharacters: completion.triggerCharacters,
          provideCompletionItems: async (model, position, context, token) => {
            const r = await this.request<L.CompletionList | L.CompletionItem[]>(
              'textDocument/completion',
              {
                ...this.params(model, position),
                context: {
                  triggerKind: context.triggerKind + 1,
                  triggerCharacter: context.triggerCharacter,
                },
              },
              token,
            )
            if (!r) return { suggestions: [] }
            const items = Array.isArray(r) ? r : r.items
            const word = model.getWordUntilPosition(position)
            const fallback = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn)
            return {
              incomplete: !Array.isArray(r) && r.isIncomplete,
              suggestions: items.map((i) => completionOf(i, fallback)),
            }
          },
        }),
      )
    }

    if (caps.signatureHelpProvider) {
      d.push(
        L.registerSignatureHelpProvider(php, {
          signatureHelpTriggerCharacters: caps.signatureHelpProvider.triggerCharacters,
          signatureHelpRetriggerCharacters: caps.signatureHelpProvider.retriggerCharacters,
          provideSignatureHelp: async (model, position, token) => {
            const s = await this.request<L.SignatureHelp>('textDocument/signatureHelp', this.params(model, position), token)
            if (!s) return null
            return {
              value: {
                activeSignature: s.activeSignature ?? 0,
                activeParameter: s.activeParameter ?? 0,
                signatures: s.signatures.map((sig) => ({
                  label: sig.label,
                  documentation: docOf(sig.documentation),
                  activeParameter: sig.activeParameter ?? undefined,
                  parameters: (sig.parameters ?? []).map((p) => ({ label: p.label, documentation: docOf(p.documentation) })),
                })),
              },
              dispose() {},
            }
          },
        }),
      )
    }

    const nav = (method: string) => async (model: Monaco.editor.ITextModel, position: Monaco.Position, token: Monaco.CancellationToken) =>
      this.locations(await this.request(method, this.params(model, position), token))
    if (caps.definitionProvider) d.push(L.registerDefinitionProvider(php, { provideDefinition: nav('textDocument/definition') }))
    if (caps.typeDefinitionProvider) d.push(L.registerTypeDefinitionProvider(php, { provideTypeDefinition: nav('textDocument/typeDefinition') }))
    if (caps.implementationProvider) d.push(L.registerImplementationProvider(php, { provideImplementation: nav('textDocument/implementation') }))
    if (caps.declarationProvider) d.push(L.registerDeclarationProvider(php, { provideDeclaration: nav('textDocument/declaration') }))
    if (caps.referencesProvider) {
      d.push(
        L.registerReferenceProvider(php, {
          provideReferences: async (model, position, context, token) =>
            this.locations(
              await this.request('textDocument/references', { ...this.params(model, position), context }, token),
            ),
        }),
      )
    }
    if (caps.documentHighlightProvider) {
      d.push(
        L.registerDocumentHighlightProvider(php, {
          provideDocumentHighlights: async (model, position, token) => {
            const r = await this.request<L.DocumentHighlight[]>('textDocument/documentHighlight', this.params(model, position), token)
            return (r ?? []).map((h) => ({ range: monacoRange(h.range), kind: (h.kind ?? 1) - 1 }))
          },
        }),
      )
    }

    if (caps.renameProvider) {
      d.push(
        L.registerRenameProvider(php, {
          provideRenameEdits: async (model, position, newName, token) => {
            const edit = await this.request<L.WorkspaceEdit>('textDocument/rename', { ...this.params(model, position), newName }, token)
            const converted = await this.workspaceEdit(edit ?? undefined)
            return converted ?? { edits: [], rejectReason: 'Nothing to rename here.' }
          },
          resolveRenameLocation: async (model, position, token) => {
            const r = await this.request<L.PrepareRenameResult>('textDocument/prepareRename', this.params(model, position), token)
            if (!r) return { range: new monaco.Range(1, 1, 1, 1), text: '', rejectReason: "This can't be renamed." }
            if ('range' in r) return { range: monacoRange(r.range), text: r.placeholder }
            if ('start' in r) {
              const range = monacoRange(r)
              return { range, text: model.getValueInRange(range) }
            }
            const word = model.getWordAtPosition(position)
            return {
              range: new monaco.Range(position.lineNumber, word?.startColumn ?? position.column, position.lineNumber, word?.endColumn ?? position.column),
              text: word?.word ?? '',
            }
          },
        }),
      )
    }

    const formatting = (options: Monaco.languages.FormattingOptions): L.FormattingOptions => ({
      tabSize: options.tabSize,
      insertSpaces: options.insertSpaces,
    })
    if (caps.documentFormattingProvider) {
      d.push(
        L.registerDocumentFormattingEditProvider(php, {
          provideDocumentFormattingEdits: async (model, options, token) => {
            const r = await this.request<L.TextEdit[]>(
              'textDocument/formatting',
              { textDocument: { uri: model.uri.toString() }, options: formatting(options) },
              token,
            )
            return (r ?? []).map((e) => ({ range: monacoRange(e.range), text: e.newText }))
          },
        }),
      )
    }
    if (caps.documentRangeFormattingProvider) {
      d.push(
        L.registerDocumentRangeFormattingEditProvider(php, {
          provideDocumentRangeFormattingEdits: async (model, range, options, token) => {
            const r = await this.request<L.TextEdit[]>(
              'textDocument/rangeFormatting',
              { textDocument: { uri: model.uri.toString() }, range: lspRange(range), options: formatting(options) },
              token,
            )
            return (r ?? []).map((e) => ({ range: monacoRange(e.range), text: e.newText }))
          },
        }),
      )
    }

    if (caps.codeActionProvider) {
      const kinds = typeof caps.codeActionProvider === 'object' ? caps.codeActionProvider.codeActionKinds : undefined
      d.push(
        L.registerCodeActionProvider(
          php,
          {
            provideCodeActions: async (model, range, context, token) => {
              const uri = model.uri.toString()
              const lspR = lspRange(range)
              const diagnostics = (this.diagnostics.get(uri) ?? []).filter((x) => overlaps(x.range, lspR))
              const r = await this.request<(L.CodeAction | L.Command)[]>(
                'textDocument/codeAction',
                {
                  textDocument: { uri },
                  range: lspR,
                  context: {
                    diagnostics,
                    only: context.only ? [context.only] : undefined,
                    triggerKind: context.trigger,
                  },
                } satisfies L.CodeActionParams,
                token,
              )
              const actions: Monaco.languages.CodeAction[] = []
              for (const a of r ?? []) {
                if (typeof (a as L.Command).command === 'string') {
                  const c = a as L.Command
                  actions.push({ title: c.title, command: { id: c.command, title: c.title, arguments: c.arguments } })
                  continue
                }
                const action = a as L.CodeAction
                const converted: Monaco.languages.CodeAction = {
                  title: action.title,
                  kind: action.kind,
                  isPreferred: action.isPreferred,
                  disabled: action.disabled?.reason,
                  diagnostics: action.diagnostics?.map(markerOf),
                  edit: (await this.workspaceEdit(action.edit)) ?? undefined,
                  command: action.command
                    ? { id: action.command.command, title: action.command.title, arguments: action.command.arguments }
                    : undefined,
                }
                this.lspActions.set(converted, action)
                actions.push(converted)
              }
              return { actions, dispose() {} }
            },
            resolveCodeAction: async (action, token) => {
              const original = this.lspActions.get(action)
              if (!original || original.edit) return action
              const resolved = await this.request<L.CodeAction>('codeAction/resolve', original, token)
              if (!resolved) return action
              action.edit = (await this.workspaceEdit(resolved.edit)) ?? undefined
              if (resolved.command) {
                action.command = { id: resolved.command.command, title: resolved.command.title, arguments: resolved.command.arguments }
              }
              return action
            },
          },
          { providedCodeActionKinds: kinds },
        ),
      )
    }

    // commands: the editor's own, and those the server runs
    d.push(
      monaco.editor.registerCommand('stirphp.renameAt', (_accessor, uri: string, line: number, character: number) => {
        // after the edit that made the name has been applied
        setTimeout(() => {
          const path = pathOf(uri)
          if (path === null) return
          this.events.show(path, new monaco.Range(line + 1, character + 1, line + 1, character + 1))
          setTimeout(() => this.renameHere?.(), 50)
        }, 0)
      }),
      monaco.editor.registerCommand('stirphp.askParameter', async (_accessor, uri: string, offset: number, hash: string) => {
        const parameter = await this.events.ask(
          'Add a parameter',
          'As it is to be declared. With a default, existing calls stay as they are.',
          'int $limit = 10',
        )
        if (!parameter) return
        let passed: string | undefined
        if (!parameter.includes('=')) {
          passed =
            (await this.events.ask(
              'Add a parameter',
              'What existing calls pass. Left empty, they pass TODO_NEW_ARGUMENT, an error at each until it is replaced.',
              '10',
            )) || undefined
        }
        await this.request('workspace/executeCommand', {
          command: 'stirphp.addParameter',
          arguments: [{ uri, offset, hash, parameter, passed }],
        })
      }),
    )
    for (const command of caps.executeCommandProvider?.commands ?? []) {
      if (command === 'stirphp.addParameter') continue
      d.push(
        monaco.editor.registerCommand(command, (_accessor, ...args: unknown[]) => {
          void this.request('workspace/executeCommand', { command, arguments: args })
        }),
      )
    }

    if (caps.inlayHintProvider) {
      d.push(
        L.registerInlayHintsProvider(php, {
          onDidChangeInlayHints: this.inlayChanged.event,
          provideInlayHints: async (model, range, token) => {
            const r = await this.request<L.InlayHint[]>(
              'textDocument/inlayHint',
              { textDocument: { uri: model.uri.toString() }, range: lspRange(range) },
              token,
            )
            return {
              hints: (r ?? []).map((h) => ({
                label: typeof h.label === 'string' ? h.label : h.label.map((p) => ({ label: p.value })),
                position: { lineNumber: h.position.line + 1, column: h.position.character + 1 },
                kind: h.kind,
                paddingLeft: h.paddingLeft,
                paddingRight: h.paddingRight,
                tooltip: typeof h.tooltip === 'string' ? h.tooltip : h.tooltip ? { value: h.tooltip.value } : undefined,
              })),
              dispose() {},
            }
          },
        }),
      )
    }

    const tokens = caps.semanticTokensProvider
    if (tokens) {
      d.push(
        L.registerDocumentSemanticTokensProvider(php, {
          onDidChange: this.tokensChanged.event,
          getLegend: () => tokens.legend,
          provideDocumentSemanticTokens: async (model, _lastResultId, token) => {
            const r = await this.request<L.SemanticTokens>(
              'textDocument/semanticTokens/full',
              { textDocument: { uri: model.uri.toString() } },
              token,
            )
            return r ? { data: new Uint32Array(r.data), resultId: r.resultId } : null
          },
          releaseDocumentSemanticTokens() {},
        }),
      )
    }

    if (caps.documentSymbolProvider) {
      d.push(
        L.registerDocumentSymbolProvider(php, {
          provideDocumentSymbols: async (model, token) => {
            const r = await this.request<L.DocumentSymbol[] | L.SymbolInformation[]>(
              'textDocument/documentSymbol',
              { textDocument: { uri: model.uri.toString() } },
              token,
            )
            return (r ?? []).map(symbolOf)
          },
        }),
      )
    }
    if (caps.foldingRangeProvider) {
      d.push(
        L.registerFoldingRangeProvider(php, {
          provideFoldingRanges: async (model, _context, token) => {
            const r = await this.request<L.FoldingRange[]>('textDocument/foldingRange', { textDocument: { uri: model.uri.toString() } }, token)
            return (r ?? []).map((f) => ({
              start: f.startLine + 1,
              end: f.endLine + 1,
              kind: f.kind ? new L.FoldingRangeKind(f.kind) : undefined,
            }))
          },
        }),
      )
    }
    if (caps.selectionRangeProvider) {
      d.push(
        L.registerSelectionRangeProvider(php, {
          provideSelectionRanges: async (model, positions, token) => {
            const r = await this.request<L.SelectionRange[]>(
              'textDocument/selectionRange',
              { textDocument: { uri: model.uri.toString() }, positions: positions.map(lspPosition) },
              token,
            )
            return (r ?? []).map((s) => {
              const out: Monaco.languages.SelectionRange[] = []
              for (let x: L.SelectionRange | undefined = s; x; x = x.parent) out.push({ range: monacoRange(x.range) })
              return out
            })
          },
        }),
      )
    }
  }

  /** Starts renaming in the editor shown; the page sets it. */
  renameHere?: () => void
}

// ---------------------------------------------------------------------- conversions

const CLIENT_CAPABILITIES: L.ClientCapabilities = {
  general: { positionEncodings: ['utf-16'] },
  workspace: {
    applyEdit: true,
    workspaceEdit: { documentChanges: true },
    workspaceFolders: true,
    configuration: false,
    semanticTokens: { refreshSupport: true },
    inlayHint: { refreshSupport: true },
  },
  window: { showMessage: { messageActionItem: { additionalPropertiesSupport: false } }, workDoneProgress: false },
  textDocument: {
    synchronization: { didSave: false, dynamicRegistration: false },
    hover: { contentFormat: ['markdown', 'plaintext'] },
    completion: {
      completionItem: {
        snippetSupport: true,
        documentationFormat: ['markdown', 'plaintext'],
        deprecatedSupport: true,
        tagSupport: { valueSet: [1] },
        insertReplaceSupport: false,
        labelDetailsSupport: true,
      },
      contextSupport: true,
    },
    signatureHelp: {
      signatureInformation: { documentationFormat: ['markdown', 'plaintext'], parameterInformation: { labelOffsetSupport: true }, activeParameterSupport: true },
      contextSupport: false,
    },
    definition: { linkSupport: true },
    typeDefinition: { linkSupport: true },
    implementation: { linkSupport: true },
    declaration: { linkSupport: true },
    references: {},
    documentHighlight: {},
    documentSymbol: { hierarchicalDocumentSymbolSupport: true },
    formatting: {},
    rangeFormatting: {},
    rename: { prepareSupport: true },
    codeAction: {
      codeActionLiteralSupport: {
        codeActionKind: { valueSet: ['', 'quickfix', 'refactor', 'refactor.extract', 'refactor.inline', 'refactor.rewrite', 'source', 'source.organizeImports', 'source.fixAll'] },
      },
      isPreferredSupport: true,
      disabledSupport: true,
      dataSupport: true,
      resolveSupport: { properties: ['edit'] },
    },
    publishDiagnostics: { relatedInformation: false, tagSupport: { valueSet: [1, 2] }, codeDescriptionSupport: true },
    inlayHint: {},
    semanticTokens: {
      requests: { full: true, range: false },
      tokenTypes: [],
      tokenModifiers: [],
      formats: ['relative'],
      multilineTokenSupport: false,
      overlappingTokenSupport: false,
    },
    foldingRange: { lineFoldingOnly: true },
    selectionRange: {},
  },
}

export function lspPosition(p: Monaco.IPosition): L.Position {
  return { line: p.lineNumber - 1, character: p.column - 1 }
}

export function lspRange(r: Monaco.IRange): L.Range {
  return {
    start: { line: r.startLineNumber - 1, character: r.startColumn - 1 },
    end: { line: r.endLineNumber - 1, character: r.endColumn - 1 },
  }
}

export function monacoRange(r: L.Range): Monaco.Range {
  return new monaco.Range(r.start.line + 1, r.start.character + 1, r.end.line + 1, r.end.character + 1)
}

function overlaps(a: L.Range, b: L.Range): boolean {
  const before = (x: L.Position, y: L.Position) => x.line < y.line || (x.line === y.line && x.character < y.character)
  return !before(a.end, b.start) && !before(b.end, a.start)
}

function markerOf(d: L.Diagnostic): Monaco.editor.IMarkerData {
  const code = d.code === undefined ? undefined : String(d.code)
  const severity = { 1: monaco.MarkerSeverity.Error, 2: monaco.MarkerSeverity.Warning, 3: monaco.MarkerSeverity.Info, 4: monaco.MarkerSeverity.Hint }[
    d.severity ?? 1
  ]!
  return {
    startLineNumber: d.range.start.line + 1,
    startColumn: d.range.start.character + 1,
    endLineNumber: d.range.end.line + 1,
    endColumn: d.range.end.character + 1,
    severity,
    message: d.message,
    source: d.source,
    code: code && d.codeDescription ? { value: code, target: monaco.Uri.parse(d.codeDescription.href) } : code,
    tags: d.tags?.map((t) => (t === 1 ? monaco.MarkerTag.Unnecessary : monaco.MarkerTag.Deprecated)),
  }
}

function markdownOf(contents: L.Hover['contents']): Monaco.IMarkdownString[] {
  const one = (c: L.MarkupContent | L.MarkedString): Monaco.IMarkdownString =>
    typeof c === 'string'
      ? { value: c }
      : 'kind' in c
        ? { value: c.kind === 'markdown' ? c.value : escapeMarkdown(c.value) }
        : { value: '```' + c.language + '\n' + c.value + '\n```' }
  return Array.isArray(contents) ? contents.map(one) : [one(contents)]
}

function escapeMarkdown(text: string): string {
  return text.replace(/[\\`*_{}[\]()#+\-.!<>]/g, '\\$&')
}

function docOf(doc: string | L.MarkupContent | undefined): string | Monaco.IMarkdownString | undefined {
  if (doc === undefined || typeof doc === 'string') return doc
  return doc.kind === 'markdown' ? { value: doc.value } : doc.value
}

const KIND: Record<number, number> = {
  1: 18, // Text
  2: 0, // Method
  3: 1, // Function
  4: 2, // Constructor
  5: 3, // Field
  6: 4, // Variable
  7: 5, // Class
  8: 7, // Interface
  9: 8, // Module
  10: 9, // Property
  11: 12, // Unit
  12: 13, // Value
  13: 15, // Enum
  14: 17, // Keyword
  15: 27, // Snippet
  16: 19, // Color
  17: 20, // File
  18: 21, // Reference
  19: 23, // Folder
  20: 16, // EnumMember
  21: 14, // Constant
  22: 6, // Struct
  23: 10, // Event
  24: 11, // Operator
  25: 24, // TypeParameter
}

function completionOf(i: L.CompletionItem, fallback: Monaco.IRange): Monaco.languages.CompletionItem {
  let range: Monaco.IRange = fallback
  let insertText = i.insertText ?? (typeof i.label === 'string' ? i.label : '')
  if (i.textEdit) {
    if ('range' in i.textEdit) range = monacoRange(i.textEdit.range)
    else range = monacoRange(i.textEdit.insert)
    insertText = i.textEdit.newText
  }
  return {
    label: i.labelDetails ? { label: i.label, detail: i.labelDetails.detail, description: i.labelDetails.description } : i.label,
    kind: KIND[i.kind ?? 1] ?? 18,
    detail: i.detail,
    documentation: docOf(i.documentation),
    insertText,
    insertTextRules: i.insertTextFormat === 2 ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
    range,
    sortText: i.sortText,
    filterText: i.filterText,
    preselect: i.preselect,
    tags: i.tags?.includes(1) || i.deprecated ? [1] : undefined,
    additionalTextEdits: i.additionalTextEdits?.map((e) => ({ range: monacoRange(e.range), text: e.newText })),
    command: i.command ? { id: i.command.command, title: i.command.title, arguments: i.command.arguments } : undefined,
  }
}

function symbolOf(s: L.DocumentSymbol | L.SymbolInformation): Monaco.languages.DocumentSymbol {
  if ('location' in s) {
    const range = monacoRange(s.location.range)
    return { name: s.name, detail: '', kind: s.kind - 1, tags: [], range, selectionRange: range }
  }
  return {
    name: s.name,
    detail: s.detail ?? '',
    kind: s.kind - 1,
    tags: s.tags?.includes(1) ? [1] : [],
    range: monacoRange(s.range),
    selectionRange: monacoRange(s.selectionRange),
    children: s.children?.map(symbolOf),
  }
}
