<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useData, withBase } from 'vitepress'
import { examples } from './examples'

type Monaco = typeof import('monaco-editor/editor/editor.api')
interface Span { startLine: number; startColumn: number; endLine: number; endColumn: number }
interface Diagnostic extends Span { severity: 'error' | 'warning' | 'hint'; code: string; message: string }

const { isDark } = useData()
const status = ref<'loading' | 'ready' | 'failed'>('loading')
const failure = ref('')
const errors = ref(0)
const warnings = ref(0)
const inline = ref(false)
const example = ref(0)
const copied = ref(false)
const inputEl = ref<HTMLElement>()
const outputEl = ref<HTMLElement>()

const monacoRef = shallowRef<Monaco>()
let input: import('monaco-editor').editor.IStandaloneCodeEditor | undefined
let output: import('monaco-editor').editor.IStandaloneCodeEditor | undefined
let playground: { check(s: string): string; compile(s: string, i: boolean): string; hover(s: string, l: number, c: number): string; complete(s: string, l: number, c: number): string } | undefined
let timer: ReturnType<typeof setTimeout> | undefined
const disposables: { dispose(): void }[] = []

/** The program in the URL (`#code=<base64url>`), if any. */
function sharedCode(): string | undefined {
  const m = location.hash.match(/^#code=(.+)$/)
  if (!m) return undefined
  try {
    const b64 = m[1].replace(/-/g, '+').replace(/_/g, '/')
    return new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)))
  } catch {
    return undefined
  }
}

function update() {
  const monaco = monacoRef.value
  if (!monaco || !input || !playground) return
  const source = input.getValue()
  const diags: Diagnostic[] = JSON.parse(playground.check(source))
  const sev = { error: monaco.MarkerSeverity.Error, warning: monaco.MarkerSeverity.Warning, hint: monaco.MarkerSeverity.Hint }
  monaco.editor.setModelMarkers(
    input.getModel()!,
    'sphp',
    diags.map((d) => ({
      startLineNumber: d.startLine,
      startColumn: d.startColumn,
      endLineNumber: d.endLine,
      endColumn: d.endColumn,
      severity: sev[d.severity],
      message: d.message,
      code: d.code,
      source: 'sphp',
    })),
  )
  errors.value = diags.filter((d) => d.severity === 'error').length
  warnings.value = diags.filter((d) => d.severity === 'warning').length
  const compiled = JSON.parse(playground.compile(source, inline.value))
  output?.setValue(compiled.php)
}

function schedule() {
  clearTimeout(timer)
  timer = setTimeout(update, 120)
}

function load(i: number) {
  input?.setValue(examples[i].code)
  history.replaceState(null, '', location.pathname + location.search)
}

async function share() {
  const bytes = new TextEncoder().encode(input?.getValue() ?? '')
  const b64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  history.replaceState(null, '', `#code=${b64}`)
  try {
    await navigator.clipboard.writeText(location.href)
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  } catch {
    // the link is in the address bar
  }
}

onMounted(async () => {
  try {
    const [monaco, { default: EditorWorker }, { registerSphp }] = await Promise.all([
      import('monaco-editor/editor/editor.api'),
      import('monaco-editor/editor/editor.worker?worker'),
      import('./sphp-language'),
      import('monaco-editor/languages/definitions/php/register'),
    ])
    ;(self as any).MonacoEnvironment = { getWorker: () => new EditorWorker() }
    registerSphp(monaco)
    monacoRef.value = monaco

    const wasmJs = withBase('/playground/stir_wasm.js')
    const mod = await import(/* @vite-ignore */ wasmJs)
    await mod.default({ module_or_path: withBase('/playground/stir_wasm_bg.wasm') })
    playground = new mod.Playground()

    const common = {
      fontFamily: "'Roboto Mono', ui-monospace, Menlo, monospace",
      fontSize: 14,
      lineHeight: 22,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      padding: { top: 14, bottom: 14 },
      theme: isDark.value ? 'stir-dark' : 'stir-light',
      renderLineHighlightOnlyWhenFocus: true,
    }
    input = monaco.editor.create(inputEl.value!, {
      ...common,
      value: sharedCode() ?? examples[0].code,
      language: 'sphp',
      tabSize: 4,
    })
    output = monaco.editor.create(outputEl.value!, {
      ...common,
      value: '',
      language: 'php',
      readOnly: true,
      domReadOnly: true,
      readOnlyMessage: { value: 'The generated PHP is read-only: edit the StirPHP on the left.' },
    })

    disposables.push(
      input.onDidChangeModelContent(schedule),
      monaco.languages.registerHoverProvider('sphp', {
        provideHover(model, pos) {
          const h = JSON.parse(playground!.hover(model.getValue(), pos.lineNumber, pos.column))
          if (!h) return null
          return {
            range: new monaco.Range(h.startLine, h.startColumn, h.endLine, h.endColumn),
            contents: [{ value: h.markdown.replace(/```sphp/g, '```php') }],
          }
        },
      }),
      monaco.languages.registerCompletionItemProvider('sphp', {
        triggerCharacters: ['>', ':', '$'],
        provideCompletionItems(model, pos) {
          const c = JSON.parse(playground!.complete(model.getValue(), pos.lineNumber, pos.column))
          const range = new monaco.Range(c.startLine, c.startColumn, c.endLine, c.endColumn)
          const K = monaco.languages.CompletionItemKind
          const kinds: Record<string, number> = {
            variable: K.Variable, function: K.Function, method: K.Method, property: K.Property,
            field: K.Field, constant: K.Constant, enumMember: K.EnumMember, class: K.Class,
            interface: K.Interface, enum: K.Enum, struct: K.Struct, keyword: K.Keyword,
          }
          return {
            suggestions: c.items.map((i: any) => ({
              label: i.label,
              kind: kinds[i.kind] ?? K.Text,
              detail: i.detail ?? undefined,
              insertText: i.insert,
              sortText: i.sort,
              range,
            })),
          }
        },
      }),
    )
    update()
    status.value = 'ready'
  } catch (e) {
    failure.value = String(e)
    status.value = 'failed'
  }
})

watch(isDark, (dark) => monacoRef.value?.editor.setTheme(dark ? 'stir-dark' : 'stir-light'))
watch(inline, update)
watch(example, load)

onBeforeUnmount(() => {
  clearTimeout(timer)
  disposables.forEach((d) => d.dispose())
  input?.dispose()
  output?.dispose()
})
</script>

<template>
  <div class="playground">
    <div class="toolbar">
      <label>
        <span class="sr-only">Example</span>
        <select v-model.number="example" :disabled="status !== 'ready'">
          <option v-for="(e, i) in examples" :key="e.name" :value="i">{{ e.name }}</option>
        </select>
      </label>
      <span class="status" :class="{ bad: errors > 0 }" aria-live="polite">
        <template v-if="status === 'loading'">Loading the compiler…</template>
        <template v-else-if="status === 'failed'">The compiler failed to load.</template>
        <template v-else-if="errors === 0 && warnings === 0">No problems</template>
        <template v-else>{{ errors }} error{{ errors === 1 ? '' : 's' }}, {{ warnings }} warning{{ warnings === 1 ? '' : 's' }}</template>
      </span>
      <span class="spacer" />
      <label class="check"><input v-model="inline" type="checkbox" /> inline extensions</label>
      <button type="button" class="share" :disabled="status !== 'ready'" @click="share">{{ copied ? 'Link copied' : 'Share' }}</button>
    </div>
    <div class="panes">
      <section aria-label="StirPHP source">
        <header>main.sphp</header>
        <div ref="inputEl" class="editor" />
      </section>
      <section aria-label="Generated PHP">
        <header>main.php <small>generated · read-only</small></header>
        <div ref="outputEl" class="editor" />
      </section>
    </div>
    <p v-if="status === 'failed'" class="failure">{{ failure }}</p>
  </div>
</template>

<style scoped>
.playground {
  margin-top: 8px;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
select,
.share {
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--vp-c-border);
  border-radius: 5px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font: inherit;
  font-size: 14px;
}
.share {
  cursor: pointer;
  font-weight: 500;
}
.share:hover:not(:disabled) {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.status {
  font-size: 14px;
  color: var(--vp-c-text-2);
}
.status.bad {
  color: var(--vp-c-brand-1);
}
.spacer {
  flex: 1;
}
.check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.check input {
  accent-color: var(--vp-c-brand-3);
}
.panes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
section {
  border: 1px solid var(--vp-c-border);
  border-radius: 5px;
  overflow: hidden;
  background: var(--vp-code-block-bg);
}
section header {
  padding: 8px 14px;
  border-bottom: 1px solid var(--vp-c-divider);
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  color: var(--vp-c-text-2);
}
section header small {
  margin-left: 6px;
  color: var(--vp-c-text-3);
}
.editor {
  height: min(68vh, 640px);
}
.failure {
  color: var(--vp-c-brand-1);
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
@media (max-width: 900px) {
  .panes {
    grid-template-columns: 1fr;
  }
  .editor {
    height: 420px;
  }
}
</style>
