#!/usr/bin/env node
// Runs the documentation's examples with the real `stirphp`, and checks that what the pages show
// is what it prints.
//
//   npm run examples            # check: fail if any output differs from the saved one
//   npm run examples -- --update  # save what it prints now
//
// `stirphp` is $STIRPHP (a path), or the one on the PATH.
//
// Each folder in `examples/` and `samples/` with an `example.json` is a project. It's copied to
// a temporary folder, and each run in `example.json` is made there in order, so one can see what
// an earlier one wrote:
//
//   { "runs": [
//       { "args": ["check"], "exit": 1, "out": "check.console" },
//       { "args": ["check", "--generate-baseline"], "out": "baseline.console",
//         "files": { "stirphp-baseline.neon": "baseline.neon" } },
//       { "args": ["fmt", "-"], "stdin": "src/ugly.php", "out": "fmt.console" }
//   ] }
//
// Outputs go to `output/` in the project's folder. `out` gets `$ stirphp <args>` and then what it
// printed, standard output and error together, as a terminal shows them. `files` saves files the
// run wrote, to be shown on a page as they are. `{ "copy": { "from": "to" } }` changes files
// between runs. `"needs": ["phpstan"]` in `example.json` copies `composer.lock` and `vendor/`
// from $PHPSTAN_HOME, a folder where `composer install` was run with the example's
// `composer.json` (which requires PHPStan), and without it the project is skipped. The pages include the outputs
// (`<<< @/examples/.../output/...`), so they can't drift from real runs.

import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, mkdirSync, writeFileSync, openSync, closeSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const update = process.argv.includes('--update')
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const stirphp = process.env.STIRPHP ? resolve(process.env.STIRPHP) : 'stirphp'

const version = spawnSync(stirphp, ['--version'], { encoding: 'utf8' })
if (version.status !== 0) {
  console.error(`can't run ${stirphp}: set STIRPHP to the binary's path`)
  process.exit(2)
}
console.log(`using ${version.stdout.trim()} (${stirphp})`)

const projects = ['examples', 'samples'].flatMap((dir) =>
  existsSync(join(root, dir))
    ? readdirSync(join(root, dir))
        .filter((name) => existsSync(join(root, dir, name, 'example.json')))
        .map((name) => join(dir, name))
    : [],
)

let failed = 0
let checked = 0
let ran = 0
for (const project of projects) {
  if (only.length > 0 && !only.some((o) => project.includes(o))) continue
  ran++
  const manifest = JSON.parse(readFileSync(join(root, project, 'example.json'), 'utf8'))
  const tmp = mkdtempSync(join(tmpdir(), 'stirphp-example-'))
  const work = join(tmp, 'project')
  cpSync(join(root, project), work, {
    recursive: true,
    filter: (src) => !src.endsWith('/example.json') && !src.endsWith('/output') && !src.includes('/output/'),
  })
  if (manifest.needs?.includes('phpstan')) {
    // PHPStan isn't in the repository: a folder where `composer install` was run with the
    // project's `composer.json`, whose `composer.lock` and `vendor/` are copied
    const home = process.env.PHPSTAN_HOME
    if (!home) {
      console.log(`${project}: skipped, as it needs PHPStan (see PHPSTAN_HOME in scripts/run-examples.mjs)`)
      rmSync(tmp, { recursive: true, force: true })
      continue
    }
    cpSync(join(home, 'vendor'), join(work, 'vendor'), { recursive: true, verbatimSymlinks: true })
    cpSync(join(home, 'composer.lock'), join(work, 'composer.lock'))
  }
  for (const run of manifest.runs) {
    // a change between runs: files copied over others
    if (run.copy) {
      for (const [from, to] of Object.entries(run.copy)) cpSync(join(work, from), join(work, to))
      continue
    }
    const outFile = join(tmp, 'out')
    const fd = openSync(outFile, 'w')
    const stdin = run.stdin ? openSync(join(work, run.stdin), 'r') : 'ignore'
    const r = spawnSync(stirphp, run.args, {
      cwd: work,
      stdio: [stdin, fd, fd],
      env: { ...process.env, NO_COLOR: '1', STIRPHP_LOG: '' },
      timeout: 120_000,
    })
    closeSync(fd)
    if (typeof stdin === 'number') closeSync(stdin)
    const printed = readFileSync(outFile, 'utf8').replaceAll(work, '/path/to/project')
    const text = `$ stirphp ${run.args.join(' ')}\n${printed}`
    const expectExit = run.exit ?? 0
    const where = `${project}: stirphp ${run.args.join(' ')}`
    if (r.status !== expectExit) {
      console.error(`${where}: exit ${r.status}, expected ${expectExit}\n${printed}`)
      failed++
    }
    const saved = [[run.out, text]]
    for (const [from, to] of Object.entries(run.files ?? {})) {
      const path = join(work, from)
      if (!existsSync(path)) {
        console.error(`${where}: didn't write ${from}`)
        failed++
        continue
      }
      saved.push([to, readFileSync(path, 'utf8')])
    }
    for (const [name, content] of saved) {
      if (!name) continue
      checked++
      const target = join(root, project, 'output', name)
      if (update) {
        mkdirSync(join(root, project, 'output'), { recursive: true })
        writeFileSync(target, content)
      } else if (!existsSync(target) || readFileSync(target, 'utf8') !== content) {
        console.error(`${where}: ${project}/output/${name} differs from what it prints now:\n${content}`)
        failed++
      }
    }
  }
  rmSync(tmp, { recursive: true, force: true })
}

if (failed > 0) {
  console.error(`${failed} example output(s) differ; run with --update if the new ones are right`)
  process.exit(1)
}
console.log(`${checked} outputs ${update ? 'saved' : 'match'}, from ${ran} projects`)
