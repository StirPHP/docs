<script setup lang="ts">
// The editor page: Monaco, connected to StirPHP's language server running in a Web Worker, on a
// sample project. Nothing of it loads until this is shown.
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { useData } from 'vitepress'
import type * as Monaco from 'monaco-editor'

type Client = typeof import('./client')

const { isDark } = useData()

const host = ref<HTMLElement>()
const status = ref<'loading' | 'starting' | 'ready' | 'failed'>('loading')
const failure = ref('')
const client = shallowRef<Client>()
const session = shallowRef<InstanceType<Client['Session']>>()
let editor: Monaco.editor.IStandaloneCodeEditor | undefined

const sampleId = ref('basics')
const level = ref<string | null>(null)
const php = ref<string | null>(null)
const paths = ref<string[]>([])
const tabs = ref<string[]>([])
const active = ref<string | null>(null)
const problems = ref<import('./client').Problem[]>([])
const collapsed = reactive(new Set<string>(['vendor']))
const phone = ref(false)
const filesOpen = ref(false)
const editing = ref(true)
const problemsOpen = ref(true)
const toast = ref<{ text: string; bad: boolean } | null>(null)
const askInput = ref<HTMLInputElement>()
const asking = ref<{ title: string; prompt: string; placeholder: string; value: string; done(v: string | null): void } | null>(null)
const metrics = reactive({ editor: 0, server: 0, diagnostics: 0 })
const viewStates = new Map<string, Monaco.editor.ICodeEditorViewState | null>()
let toastTimer: ReturnType<typeof setTimeout> | undefined

const LEVELS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
const VERSIONS = ['7.4', '8.0', '8.1', '8.2', '8.3', '8.4', '8.5']
const SAMPLE_LIST = [
  { id: 'basics', title: 'A small shop' },
  { id: 'rules', title: 'Configuration and rules' },
  { id: 'laravel', title: 'Laravel' },
]

const sample = computed(() => client.value?.SAMPLES.find((s) => s.id === sampleId.value))
const counts = computed(() => ({
  errors: problems.value.filter((p) => p.severity === 'error').length,
  warnings: problems.value.filter((p) => p.severity === 'warning').length,
}))
const errorsByPath = computed(() => {
  const m = new Map<string, number>()
  for (const p of problems.value) if (p.severity === 'error') m.set(p.path, (m.get(p.path) ?? 0) + 1)
  return m
})

/** The project's files as a tree: folders, then what's in them. */
const tree = computed(() => {
  const root = '/project/'
  const rows: { kind: 'dir' | 'file'; path: string; name: string; depth: number }[] = []
  const rel = paths.value.map((p) => p.slice(root.length)).sort((a, b) => {
    const as = a.split('/')
    const bs = b.split('/')
    for (let i = 0; i < Math.min(as.length, bs.length); i++) {
      const aDir = i < as.length - 1
      const bDir = i < bs.length - 1
      if (as[i] !== bs[i]) {
        if (aDir !== bDir) return aDir ? -1 : 1
        return as[i].localeCompare(bs[i])
      }
    }
    return as.length - bs.length
  })
  const seen = new Set<string>()
  for (const r of rel) {
    const parts = r.split('/')
    let hidden = false
    for (let i = 0; i < parts.length - 1; i++) {
      const dir = parts.slice(0, i + 1).join('/')
      if (!hidden && !seen.has(dir)) {
        seen.add(dir)
        rows.push({ kind: 'dir', path: dir, name: parts[i], depth: i })
      }
      if (collapsed.has(dir)) hidden = true
    }
    if (!hidden) rows.push({ kind: 'file', path: root + r, name: parts[parts.length - 1], depth: parts.length - 1 })
  }
  return rows
})

function label(path: string): string {
  if (path.startsWith('stirphp:')) return path.split('/').pop() + ' (stub)'
  return path.split('/').pop() ?? path
}

function short(path: string): string {
  return path.replace(/^\/project\//, '')
}

function say(text: string, bad = false) {
  toast.value = { text, bad }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = null), 6000)
}

/** Shows a file of the project, or a stub by its URI, at a place. */
async function show(path: string, range?: Monaco.IRange) {
  const c = client.value
  const s = session.value
  if (!c || !s || !editor) return
  const uri = path.startsWith('/') ? c.uriOf(path) : path
  const model = await s.model(uri)
  if (!model) {
    say(`Can't open ${path}`, true)
    return
  }
  if (active.value !== path) {
    if (active.value) viewStates.set(active.value, editor.saveViewState())
    if (!tabs.value.includes(path)) tabs.value = [...tabs.value, path]
    active.value = path
    // before the model, so that what looks at it once for a model, as quick fixes do, sees it:
    // the option takes a moment to apply
    await applyReadOnly(model)
    editor.setModel(model)
    const state = viewStates.get(path)
    if (state) editor.restoreViewState(state)
    s.opened(model)
  }
  if (range) {
    editor.setSelection(range)
    editor.revealRangeInCenterIfOutsideViewport(range)
  }
  if (phone.value) filesOpen.value = false
  if (!phone.value) editor.focus()
}

function close(path: string) {
  const c = client.value
  const s = session.value
  if (!c || !s || !editor) return
  const i = tabs.value.indexOf(path)
  tabs.value = tabs.value.filter((t) => t !== path)
  const model = c.monaco.editor.getModel(c.monaco.Uri.parse(path.startsWith('/') ? c.uriOf(path) : path))
  if (model) s.closed(model)
  viewStates.delete(path)
  if (active.value === path) {
    active.value = null
    const next = tabs.value[Math.min(i, tabs.value.length - 1)]
    if (next) void show(next)
    else editor.setModel(null)
  }
}

async function applyReadOnly(model = editor?.getModel()) {
  if (!editor || !client.value) return
  const stub = !!model && model.uri.scheme !== 'file'
  const readOnly = stub || !editing.value
  const option = client.value.monaco.editor.EditorOption.readOnly
  // the change is announced a moment later, and only then has it applied
  const applied = new Promise<void>((done) => {
    const listening = editor!.onDidChangeConfiguration((e) => {
      if (!e.hasChanged(option)) return
      listening.dispose()
      done()
    })
    setTimeout(() => {
      listening.dispose()
      done()
    }, 200)
  })
  const changed = editor.getRawOptions().readOnly !== readOnly
  editor.updateOptions({
    readOnly,
    domReadOnly: readOnly,
    readOnlyMessage: { value: stub ? "PHP's stubs are read-only." : 'Read-only: tap Edit to change the code.' },
  })
  if (changed) await applied
}

/** Starts the language server on a sample, with the level and PHP version chosen. */
async function load(id: string) {
  const c = client.value!
  session.value?.dispose()
  session.value = undefined
  status.value = 'starting'
  problems.value = []
  tabs.value = []
  active.value = null
  viewStates.clear()
  editor?.setModel(null)
  const files = c.sampleFiles(id)
  const neonPath = `${c.ROOT}/stirphp.neon`
  const neon = c.withChoices(files[neonPath], level.value, php.value)
  if (neon !== null) files[neonPath] = neon
  const s = new c.Session(files, {
    problems: () => {
      if (session.value === s) problems.value = s.problems()
      if (s.firstDiagnostics !== null && !metrics.diagnostics) metrics.diagnostics = Math.round(s.firstDiagnostics)
    },
    message: (type, text) => say(text, type <= 2),
    show: (path, range) => void show(path, range),
    ask: (title, prompt, placeholder) =>
      new Promise((done) => {
        asking.value = { title, prompt, placeholder, value: '', done }
        void nextTick(() => askInput.value?.focus())
      }),
    files: () => {
      if (session.value === s) paths.value = Object.keys(s.files)
    },
  })
  session.value = s
  s.renameHere = () => editor?.trigger('stirphp', 'editor.action.rename', null)
  paths.value = Object.keys(files)
  const started = performance.now()
  try {
    await s.start()
  } catch (e) {
    failure.value = String((e as Error)?.message ?? e)
    status.value = 'failed'
    return
  }
  if (session.value !== s) return
  metrics.server = Math.round(performance.now() - started)
  status.value = 'ready'
  const meta = c.SAMPLES.find((x) => x.id === id)
  for (const p of [...(meta?.open ?? [])].reverse()) await show(`${c.ROOT}/${p}`)
  if (meta?.open[0]) await show(`${c.ROOT}/${meta.open[0]}`)
}

/** The level or PHP version changed: the configuration says so, and the project is loaded again. */
function choose() {
  const c = client.value
  const s = session.value
  if (!c || !s) return
  const neonPath = `${c.ROOT}/stirphp.neon`
  const original = c.sampleFiles(sampleId.value)[neonPath]
  const text = c.withChoices(original, level.value, php.value)
  if (text === null) {
    if (neonPath in s.files) s.setFiles({ [neonPath]: null }, true)
  } else {
    s.replaceFile(neonPath, text)
  }
  paths.value = Object.keys(s.files)
  say(
    text === null
      ? 'The project uses its own settings again.'
      : `stirphp.neon now says ${[level.value !== null && `level ${level.value}`, php.value !== null && `PHP ${php.value}`].filter(Boolean).join(' and ') || 'what the sample had'}.`,
  )
}

function answer(value: string | null) {
  const a = asking.value
  asking.value = null
  a?.done(value)
}

function format() {
  void editor?.getAction('editor.action.formatDocument')?.run()
}

function toggleDir(path: string) {
  if (collapsed.has(path)) collapsed.delete(path)
  else collapsed.add(path)
}

watch(isDark, (dark) => client.value?.monaco.editor.setTheme(dark ? 'stir-dark' : 'stir-light'))
watch(sampleId, (id) => {
  const url = new URL(location.href)
  url.searchParams.set('sample', id)
  history.replaceState(history.state, '', url)
  if (client.value) void load(id)
})
watch([level, php], choose)
watch(editing, async () => {
  await applyReadOnly()
  // quick fixes and the like only see a change of read-only with a model
  const model = editor?.getModel()
  if (editor && model) {
    const state = editor.saveViewState()
    editor.setModel(null)
    editor.setModel(model)
    editor.restoreViewState(state)
  }
})

let media: MediaQueryList | undefined
const onMedia = () => {
  phone.value = !!media?.matches
  editing.value = !phone.value
  editor?.updateOptions(phoneOptions())
}
function phoneOptions(): Monaco.editor.IEditorOptions {
  return phone.value
    ? { fontSize: 13, lineHeight: 20, lineNumbersMinChars: 2, folding: false, glyphMargin: false, lineDecorationsWidth: 4 }
    : { fontSize: 14, lineHeight: 22, lineNumbersMinChars: 3, folding: true, glyphMargin: false, lineDecorationsWidth: 10 }
}

onMounted(async () => {
  media = matchMedia('(max-width: 767px)')
  media.addEventListener('change', onMedia)
  phone.value = media.matches
  editing.value = !phone.value
  problemsOpen.value = true
  const wanted = new URL(location.href).searchParams.get('sample')
  if (wanted && SAMPLE_LIST.some((s) => s.id === wanted)) sampleId.value = wanted
  const t0 = performance.now()
  try {
    if (import.meta.env.SSR) return
    const c = await import('./client')
    client.value = c
    await nextTick()
    editor = c.monaco.editor.create(host.value!, {
      model: null,
      theme: isDark.value ? 'stir-dark' : 'stir-light',
      fontFamily: "'Roboto Mono', ui-monospace, Menlo, monospace",
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      tabSize: 4,
      'semanticHighlighting.enabled': true,
      inlayHints: { enabled: 'on' },
      fixedOverflowWidgets: true,
      padding: { top: 10, bottom: 10 },
      renderLineHighlightOnlyWhenFocus: true,
      ...phoneOptions(),
    } as Monaco.editor.IStandaloneEditorConstructionOptions)
    metrics.editor = Math.round(performance.now() - t0)
    ;(window as any).__stirEditor = { editor, monaco: c.monaco, session: () => session.value, metrics, show }
    await load(sampleId.value)
  } catch (e) {
    failure.value = String((e as Error)?.message ?? e)
    status.value = 'failed'
  }
})

onBeforeUnmount(() => {
  media?.removeEventListener('change', onMedia)
  clearTimeout(toastTimer)
  session.value?.dispose()
  editor?.dispose()
  delete (window as any).__stirEditor
})
</script>

<template>
  <div class="stir-editor" :class="{ phone }">
    <div class="bar">
      <label>
        <span>Sample</span>
        <select v-model="sampleId" :disabled="status === 'loading'">
          <option v-for="s in SAMPLE_LIST" :key="s.id" :value="s.id">{{ s.title }}</option>
        </select>
      </label>
      <label>
        <span>PHP</span>
        <select v-model="php" :disabled="status !== 'ready'">
          <option :value="null">the project's</option>
          <option v-for="v in VERSIONS" :key="v" :value="v">{{ v }}</option>
        </select>
      </label>
      <label>
        <span>Level</span>
        <select v-model="level" :disabled="status !== 'ready'">
          <option :value="null">the project's</option>
          <option v-for="l in LEVELS" :key="l" :value="l">{{ l }}</option>
        </select>
      </label>
      <span class="status" :class="{ bad: counts.errors > 0 || status === 'failed' }" aria-live="polite">
        <template v-if="status === 'loading'">Loading the editor…</template>
        <template v-else-if="status === 'starting'">Starting StirPHP…</template>
        <template v-else-if="status === 'failed'">It didn't start.</template>
        <template v-else-if="counts.errors === 0 && counts.warnings === 0">No problems</template>
        <template v-else>
          {{ counts.errors }} error{{ counts.errors === 1 ? '' : 's' }}, {{ counts.warnings }} warning{{ counts.warnings === 1 ? '' : 's' }}
        </template>
      </span>
      <span class="spacer" />
      <button v-if="phone" type="button" :aria-expanded="filesOpen" @click="filesOpen = !filesOpen">Files</button>
      <button v-if="phone" type="button" :aria-pressed="editing" @click="editing = !editing">
        {{ editing ? 'Done' : 'Edit' }}
      </button>
      <button type="button" :disabled="status !== 'ready' || !active" @click="format">Format</button>
    </div>
    <p v-if="sample" class="about">{{ sample.about }}</p>
    <p v-if="status === 'failed'" class="failure">{{ failure }}</p>

    <div class="body">
      <nav v-show="!phone || filesOpen" class="files" aria-label="Files of the project">
        <template v-for="row in tree" :key="row.kind + row.path">
          <button
            v-if="row.kind === 'dir'"
            type="button"
            class="row dir"
            :style="{ paddingLeft: 8 + row.depth * 12 + 'px' }"
            :aria-expanded="!collapsed.has(row.path)"
            @click="toggleDir(row.path)"
          >
            <span class="caret">{{ collapsed.has(row.path) ? '▸' : '▾' }}</span>{{ row.name }}
          </button>
          <button
            v-else
            type="button"
            class="row file"
            :class="{ active: active === row.path }"
            :style="{ paddingLeft: 20 + row.depth * 12 + 'px' }"
            @click="show(row.path)"
          >
            <span class="name">{{ row.name }}</span>
            <span v-if="errorsByPath.get(row.path)" class="count">{{ errorsByPath.get(row.path) }}</span>
          </button>
        </template>
      </nav>

      <div class="main">
        <div class="tabs" role="tablist">
          <div v-for="t in tabs" :key="t" class="tab" :class="{ active: active === t }" role="tab" :aria-selected="active === t">
            <button type="button" class="open" :title="short(t)" @click="show(t)">{{ label(t) }}</button>
            <button type="button" class="x" :aria-label="'Close ' + label(t)" @click="close(t)">×</button>
          </div>
        </div>
        <div ref="host" class="monaco" />
      </div>
    </div>

    <section class="problems">
      <button type="button" class="head" :aria-expanded="problemsOpen" @click="problemsOpen = !problemsOpen">
        Problems ({{ problems.length }})
      </button>
      <ul v-show="problemsOpen">
        <li v-for="(p, i) in problems" :key="i">
          <button
            type="button"
            :class="p.severity"
            @click="show(p.path, { startLineNumber: p.line, startColumn: p.column, endLineNumber: p.line, endColumn: p.column })"
          >
            <span class="where">{{ short(p.path) }}:{{ p.line }}</span>
            <span class="message">{{ p.message }}</span>
            <code>{{ p.code }}</code>
          </button>
        </li>
      </ul>
    </section>

    <p class="metrics" v-if="metrics.server">
      Editor loaded in {{ metrics.editor }} ms; StirPHP started in {{ metrics.server }} ms<template v-if="metrics.diagnostics">, first diagnostics after {{ metrics.diagnostics }} ms</template>.
    </p>

    <div v-if="toast" class="toast" :class="{ bad: toast.bad }" role="status" @click="toast = null">{{ toast.text }}</div>

    <div v-if="asking" class="ask" role="dialog" aria-modal="true" :aria-label="asking.title">
      <form @submit.prevent="answer(asking.value)">
        <strong>{{ asking.title }}</strong>
        <p>{{ asking.prompt }}</p>
        <input ref="askInput" v-model="asking.value" :placeholder="asking.placeholder" @keydown.esc="answer(null)" />
        <div class="buttons">
          <button type="button" @click="answer(null)">Cancel</button>
          <button type="submit">OK</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.stir-editor {
  --gap: 12px;
  position: relative;
  font-size: 14px;
}
.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  margin-bottom: 8px;
}
.bar label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--vp-c-text-2);
}
select,
.bar button,
.ask button,
.ask input {
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--vp-c-border);
  border-radius: 5px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font: inherit;
  font-size: 14px;
}
.bar button,
.ask button {
  cursor: pointer;
  font-weight: 500;
}
.bar button:hover:not(:disabled),
.ask button:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.status {
  color: var(--vp-c-text-2);
}
.status.bad {
  color: var(--vp-c-brand-1);
}
.spacer {
  flex: 1;
}
.about {
  margin: 0 0 10px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.5;
}
.failure {
  color: var(--vp-c-brand-1);
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
}
.body {
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  gap: var(--gap);
}
.files {
  border: 1px solid var(--vp-c-border);
  border-radius: 5px;
  padding: 6px 0;
  max-height: min(70vh, 720px);
  overflow: auto;
  background: var(--vp-c-bg-soft);
}
.row {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 28px;
  padding: 2px 8px;
  border: 0;
  background: none;
  color: var(--vp-c-text-1);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.row:hover {
  background: var(--vp-c-default-soft);
}
.row.dir {
  color: var(--vp-c-text-2);
}
.caret {
  display: inline-block;
  width: 12px;
}
.row.file.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}
.row .name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--vp-font-family-mono);
}
.count {
  min-width: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
  font-size: 11px;
  text-align: center;
}
.main {
  min-width: 0;
  border: 1px solid var(--vp-c-border);
  border-radius: 5px;
  overflow: hidden;
  background: var(--vp-code-block-bg);
}
.tabs {
  display: flex;
  overflow-x: auto;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  scrollbar-width: thin;
}
.tab {
  display: flex;
  align-items: center;
  flex: none;
  border-right: 1px solid var(--vp-c-divider);
}
.tab.active {
  background: var(--vp-code-block-bg);
  box-shadow: inset 0 -2px 0 var(--vp-c-brand-1);
}
.tab button {
  border: 0;
  background: none;
  color: var(--vp-c-text-2);
  font: inherit;
  cursor: pointer;
}
.tab .open {
  padding: 7px 4px 7px 12px;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
}
.tab.active .open {
  color: var(--vp-c-text-1);
}
.tab .x {
  padding: 4px 10px 4px 6px;
  font-size: 16px;
}
.tab .x:hover {
  color: var(--vp-c-brand-1);
}
.monaco {
  height: min(70vh, 720px);
}
.problems {
  margin-top: var(--gap);
  border: 1px solid var(--vp-c-border);
  border-radius: 5px;
}
.problems .head {
  width: 100%;
  padding: 8px 12px;
  border: 0;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font: inherit;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
}
.problems ul {
  max-height: 240px;
  margin: 0;
  padding: 0;
  overflow: auto;
  list-style: none;
}
.problems li button {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 4px 12px;
  width: 100%;
  padding: 6px 12px;
  border: 0;
  border-top: 1px solid var(--vp-c-divider);
  background: none;
  color: var(--vp-c-text-1);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.problems li button:hover {
  background: var(--vp-c-default-soft);
}
.problems .where {
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-2);
  white-space: nowrap;
}
.problems .error .where::before {
  content: '●';
  margin-right: 6px;
  color: var(--vp-c-brand-1);
}
.problems .warning .where::before {
  content: '●';
  margin-right: 6px;
  color: #c98a00;
}
.problems .info .where::before {
  content: '●';
  margin-right: 6px;
  color: var(--vp-c-text-3);
}
.problems .message {
  overflow-wrap: anywhere;
}
.problems code {
  padding: 0;
  background: none;
  color: var(--vp-c-text-3);
  font-size: 12px;
}
.metrics {
  margin: 10px 0 0;
  color: var(--vp-c-text-3);
  font-size: 12px;
}
.toast {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 50;
  max-width: min(480px, calc(100vw - 32px));
  padding: 10px 14px;
  border: 1px solid var(--vp-c-border);
  border-radius: 5px;
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-1);
  box-shadow: 0 6px 24px rgb(0 0 0 / 0.18);
  cursor: pointer;
}
.toast.bad {
  border-color: var(--vp-c-brand-1);
}
.ask {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgb(0 0 0 / 0.35);
}
.ask form {
  width: min(440px, 100%);
  padding: 18px;
  border: 1px solid var(--vp-c-border);
  border-radius: 5px;
  background: var(--vp-c-bg);
}
.ask p {
  margin: 8px 0 12px;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}
.ask input {
  width: 100%;
  font-family: var(--vp-font-family-mono);
}
.ask .buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}

/* phones: the files fold away, the editor takes the width */
.phone .bar {
  gap: 8px 10px;
}
.phone .body {
  grid-template-columns: minmax(0, 1fr);
}
.phone .files {
  max-height: 45vh;
}
.phone .monaco {
  height: 56vh;
}
.phone .problems li button {
  grid-template-columns: 1fr auto;
}
.phone .problems .message {
  grid-column: 1 / -1;
}
</style>
