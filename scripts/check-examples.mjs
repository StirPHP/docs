#!/usr/bin/env node
// Type-checks every ```sphp code block of the documentation, and the
// playground's example programs, with the real
// compiler (`sphp` on PATH, or $SPHP).
//
// A block passes when its diagnostics are exactly the ones it marks with
// trailing `// error: SPHP0005` / `// warning: SPHP0021` comments (several
// codes separated by `,`). Blocks without a `namespace` get a unique one, so
// examples on different pages can reuse names. Put `<!-- no-check -->` on the
// line before a block to skip it (for fragments that aren't whole programs).

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, mkdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'

const root = new URL('..', import.meta.url).pathname
// a path (not a bare command name) is relative to where the script is run
const sphp = process.env.SPHP?.includes('/') ? resolve(process.env.SPHP) : (process.env.SPHP ?? 'sphp')

function markdownFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (name.startsWith('.') || name === 'node_modules') return []
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return markdownFiles(path)
    return name.endsWith('.md') ? [path] : []
  })
}

/** ```sphp blocks of a markdown file: { line, code } */
function blocks(file) {
  const lines = readFileSync(file, 'utf8').split('\n')
  const out = []
  for (let i = 0; i < lines.length; i++) {
    const open = lines[i].match(/^(\s*)(`{3,})sphp\b/)
    if (!open) continue
    const skip = i > 0 && lines[i - 1].trim() === '<!-- no-check -->'
    const fence = open[2]
    const body = []
    let j = i + 1
    for (; j < lines.length && !lines[j].trimStart().startsWith(fence); j++) body.push(lines[j])
    if (!skip) out.push({ line: i + 1, code: body.join('\n') + '\n' })
    i = j
  }
  return out
}

function expected(code, offset) {
  const out = []
  code.split('\n').forEach((line, i) => {
    for (const severity of ['error', 'warning']) {
      const m = line.match(new RegExp(`// ${severity}: (.*)$`))
      if (m) for (const c of m[1].split(',')) out.push(`${i + 1 + offset}:${severity}:${c.trim()}`)
    }
  })
  return out.sort()
}

const project = mkdtempSync(join(tmpdir(), 'stirphp-docs-'))
mkdirSync(join(project, 'src'))
writeFileSync(join(project, 'sphp.toml'), 'srcDir = "src"\noutDir = "build"\n')

const cases = []
for (const file of markdownFiles(root)) {
  for (const b of blocks(file)) {
    const n = cases.length
    const hasNamespace = /^\s*namespace\s/m.test(b.code)
    const prefix = hasNamespace ? '' : `namespace Example${n}\n`
    const name = `e${n}.sphp`
    writeFileSync(join(project, 'src', name), prefix + b.code)
    cases.push({
      where: `${relative(root, file)}:${b.line}`,
      name,
      want: expected(b.code, hasNamespace ? 0 : 1),
      lineShift: hasNamespace ? 0 : 1,
    })
  }
}

// the playground's example programs (Node runs the .ts file directly)
const { examples } = await import('../.vitepress/theme/playground/examples.ts')
for (const e of examples) {
  const n = cases.length
  const hasNamespace = /^\s*namespace\s/m.test(e.code)
  const name = `e${n}.sphp`
  writeFileSync(join(project, 'src', name), (hasNamespace ? '' : `namespace Example${n}\n`) + e.code)
  cases.push({ where: `playground example "${e.name}"`, name, want: expected(e.code, hasNamespace ? 0 : 1), lineShift: hasNamespace ? 0 : 1 })
}

let stdout
try {
  stdout = execFileSync(sphp, ['check', '--format', 'json'], { cwd: project, encoding: 'utf8' })
} catch (e) {
  // `sphp check` exits with 1 when it reports errors; anything else is a failure to run it
  if (e.status !== 1 || !e.stdout) {
    console.error(`could not run \`${sphp} check\`: ${e.message}`)
    process.exit(2)
  }
  stdout = e.stdout
}
const json = stdout.slice(stdout.indexOf('['), stdout.lastIndexOf(']') + 1)
const diags = json ? JSON.parse(json) : []

let failures = 0
for (const c of cases) {
  const got = diags
    .filter((d) => d.file.endsWith(`/${c.name}`) || d.file === `src/${c.name}`)
    .map((d) => `${d.line}:${d.severity}:${d.code}`)
    .sort()
  const same = got.length === c.want.length && got.every((g, i) => g === c.want[i])
  if (!same) {
    failures++
    console.log(`✗ ${c.where}`)
    for (const d of diags.filter((d) => d.file.endsWith(`/${c.name}`) || d.file === `src/${c.name}`)) {
      console.log(`    got  ${d.line - c.lineShift}: ${d.code} ${d.message}`)
    }
    for (const w of c.want) console.log(`    want ${w.split(':')[0] - c.lineShift}: ${w.split(':').slice(1).join(' ')}`)
  }
}

rmSync(project, { recursive: true, force: true })
console.log(`${cases.length - failures}/${cases.length} examples check as documented`)
process.exit(failures ? 1 : 0)
