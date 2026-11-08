#!/usr/bin/env node
// Writes what the reference lists from StirPHP's source, so it can't fall behind:
// `reference/diagnostics.md`, and the kinds of node rules can visit (`guide/parts/node-kinds.md`).
//
//   STIRPHP_CORE=../core npm run gen:reference            # write them
//   STIRPHP_CORE=../core npm run gen:reference -- --check # fail if they're out of date
//
// It reads:
// - `crates/stir_checker/src/codes.rs`: every fixed code, with its doc comment and section
// - `crates/stir_db/src/lib.rs`: the code of syntax errors
// - `crates/stir_checker/src/levels.rs`: the level of each code (`level_of`), which can't be
//   ignored (`is_ignorable`), and the table of what each level adds
// - the families below, identifiers built as the checker goes; each names a piece of source
//   that has to be there, so a change to how they're built fails this script instead of leaving
//   the page wrong
// - `crates/stir_checker/src/script/node.rs`: the kinds of node, as `KINDS` names them

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const core = resolve(process.env.STIRPHP_CORE ?? join(root, '..', 'core'))
const check = process.argv.includes('--check')
const out = join(root, 'reference', 'diagnostics.md')
const kindsOut = join(root, 'guide', 'parts', 'node-kinds.md')

const read = (path) => {
  const full = join(core, path)
  if (!existsSync(full)) {
    console.error(`${full} not found: set STIRPHP_CORE to StirPHP's core repository`)
    process.exit(2)
  }
  return readFileSync(full, 'utf8')
}

const codesRs = read('crates/stir_checker/src/codes.rs')
const levelsRs = read('crates/stir_checker/src/levels.rs')
const dbRs = read('crates/stir_db/src/lib.rs')
const nodeRs = read('crates/stir_checker/src/script/node.rs')
const version = read('Cargo.toml').match(/^version = "([^"]+)"/m)[1]

/** Constants of codes.rs: { name, id, doc, section } in order. */
function constants() {
  const out = []
  let doc = []
  let section = 'phpstan'
  for (const line of codesRs.split('\n')) {
    const t = line.trim()
    if (t.startsWith('// Syntax newer than')) section = 'version'
    if (t.startsWith('///')) {
      doc.push(t.replace(/^\/\/\/ ?/, ''))
      continue
    }
    const m = t.match(/^pub const (\w+): &str = "([^"]+)";/)
    if (m) {
      const id = m[2]
      out.push({ name: m[1], id, doc: doc.join(' '), section: id.startsWith('SPHP') ? 'own' : section })
    }
    if (t !== '') doc = []
  }
  return out
}

const consts = constants()
const byName = new Map(consts.map((c) => [c.name, c]))
const syntax = dbRs.match(/pub const SYNTAX: &str = "([^"]+)";/)[1]
byName.set('SYNTAX', { name: 'SYNTAX', id: syntax, doc: 'A syntax error: PHP can\'t parse the file.', section: 'phpstan' })
consts.unshift(byName.get('SYNTAX'))

/** The body of the Rust function `name` in `src`. */
function body(src, name) {
  const start = src.indexOf(`pub fn ${name}(`)
  if (start < 0) throw new Error(`levels.rs has no fn ${name}`)
  let depth = 0
  for (let i = src.indexOf('{', start); i < src.length; i++) {
    if (src[i] === '{') depth++
    if (src[i] === '}' && --depth === 0) return src.slice(start, i + 1)
  }
  throw new Error(`fn ${name} doesn't end`)
}

// level_of: `codes::A | codes::B => 3,` arms; everything else is 0
const levels = new Map()
const levelOf = body(levelsRs, 'level_of')
for (const arm of levelOf.matchAll(/((?:codes::\w+\s*\|?\s*)+)=>\s*(\d+)/g)) {
  for (const name of arm[1].matchAll(/codes::(\w+)/g)) levels.set(name[1], Number(arm[2]))
}
const unignorable = new Set([...body(levelsRs, 'is_ignorable').matchAll(/codes::(\w+)/g)].map((m) => m[1]))
for (const name of [...levels.keys(), ...unignorable]) {
  if (!byName.has(name)) throw new Error(`levels.rs names codes::${name}, which codes.rs doesn't have`)
}

// the table of levels at the top of levels.rs
const levelTable = levelsRs
  .split('\n')
  .filter((l) => /^\/\/! \| \d+ \|/.test(l))
  .map((l) => l.replace(/^\/\/! /, ''))

/** Identifiers built as the checker goes. `source` has to be in `file`. */
const families = [
  {
    ids: ['if.alwaysTrue', 'if.alwaysFalse', 'elseif.alwaysTrue', 'elseif.alwaysFalse', 'ternary.alwaysTrue', 'ternary.alwaysFalse'],
    what: 'A condition that can only go one way.',
    level: 4,
    file: 'crates/stir_checker/src/body/checks.rs',
    source: 'format!("{prefix}.always{}", title_truth(truth))',
  },
  {
    ids: ['booleanNot.alwaysTrue', 'booleanNot.alwaysFalse'],
    what: '`!$x` where `$x` can only be one thing.',
    level: 4,
    file: 'crates/stir_checker/src/body/checks.rs',
    source: 'format!("booleanNot.always{}", title_truth(negated))',
  },
  {
    ids: ['booleanAnd', 'booleanOr', 'logicalAnd', 'logicalOr'].flatMap((op) =>
      ['left', 'right'].flatMap((side) => [`${op}.${side}AlwaysTrue`, `${op}.${side}AlwaysFalse`]),
    ),
    what: 'A side of `&&`, `||`, `and` or `or` that can only be one thing.',
    level: 4,
    file: 'crates/stir_checker/src/body/checks.rs',
    source: 'format!("{id}.{title}Always{}", title_truth(truth))',
  },
  {
    ids: ['identical.alwaysTrue', 'identical.alwaysFalse', 'notIdentical.alwaysTrue', 'notIdentical.alwaysFalse'],
    what: '`===` or `!==` that can only go one way.',
    level: 4,
    file: 'crates/stir_checker/src/body/checks.rs',
    source: 'format!("{identical}.always{}", title_truth(value))',
  },
  {
    ids: ['deadCode.unreachable'],
    what: 'A statement nothing can reach.',
    level: 4,
    file: 'crates/stir_checker/src/body/checks.rs',
    source: '"deadCode.unreachable".to_owned()',
  },
  {
    ids: ['return.never'],
    what: 'A function declared `never` whose end can be reached.',
    level: 0,
    file: 'crates/stir_checker/src/body/checks.rs',
    source: '"return.never",',
  },
  {
    ids: ['function.deprecated', 'constant.deprecated'],
    what: 'Use of a deprecated function or global constant.',
    deprecation: true,
    file: 'crates/stir_checker/src/deprecations.rs',
    source: '"function.deprecated".to_owned()',
  },
  {
    ids: ['method', 'staticMethod', 'property', 'staticProperty', 'classConstant'].flatMap((m) => [
      `${m}.deprecated`,
      `${m}.deprecatedClass`,
      `${m}.deprecatedInterface`,
      `${m}.deprecatedTrait`,
      `${m}.deprecatedEnum`,
    ]),
    what: 'Use of a deprecated member (`.deprecated`), or of a member of a deprecated class-like (`.deprecatedClass` and so on).',
    deprecation: true,
    file: 'crates/stir_checker/src/deprecations.rs',
    source: 'format!("{stem}.deprecated{word}")',
  },
  {
    ids: [
      'new.deprecatedClass',
      'class.extendsDeprecatedClass',
      'interface.extendsDeprecatedInterface',
      'class.implementsDeprecatedInterface',
      'enum.implementsDeprecatedInterface',
      'traitUse.deprecatedTrait',
      'parameter.deprecatedClass',
      'parameter.deprecatedInterface',
      'parameter.deprecatedEnum',
      'return.deprecatedClass',
      'return.deprecatedInterface',
      'return.deprecatedEnum',
    ],
    what: 'A deprecated class-like named in `new`, `extends`, `implements`, `use` or a parameter\'s or return type.',
    deprecation: true,
    file: 'crates/stir_checker/src/deprecations.rs',
    source: 'id(&format!("Deprecated{word}"))',
  },
  {
    ids: ['wordpress.hookArguments'],
    what: '`add_action()` or `add_filter()` taking more arguments than any `do_action()` or `apply_filters()` of the hook passes. From the WordPress support.',
    level: 0,
    file: 'crates/stir_stubs/frameworks/wordpress.rhai',
    source: '"wordpress.hookArguments",',
  },
]
for (const f of families) {
  if (!read(f.file).includes(f.source)) {
    throw new Error(`${f.file} no longer has \`${f.source}\`: update the families in scripts/gen-reference.mjs`)
  }
}

const phpstanLink = (id) => `[${'`'}${id}${'`'}](https://phpstan.org/error-identifiers/${id})`
const cell = (s) => s.replaceAll('|', '\\|')
const row = (c) => {
  const level = levels.get(c.name) ?? 0
  const ignorable = unignorable.has(c.name) ? 'no' : 'yes'
  const id = c.id.startsWith('SPHP') ? `${'`'}${c.id}${'`'}` : phpstanLink(c.id)
  return `| ${id} | ${level} | ${ignorable} | ${cell(c.doc)} |`
}

const section = (key) => consts.filter((c) => c.section === key).map(row)
const familyRows = families.flatMap((f) => {
  const level = f.deprecation ? 'see below' : String(f.level)
  return [`| ${f.ids.map((id) => `${'`'}${id}${'`'}`).join('<br>')} | ${level} | yes | ${cell(f.what)} |`]
})

const md = `---
outline: [2, 2]
---

<!-- Written by scripts/gen-reference.mjs from StirPHP ${version}; don't edit it by hand. -->

# Diagnostics

Every identifier \`stirphp check\` and the language server report, from StirPHP ${version}'s source. Where one of
PHPStan's rules checks the same thing, the identifier is PHPStan's and links to its page; \`SPHP\` codes are StirPHP's own.

- **Level** is the lowest [level](/guide/levels) that reports it. Some reports of a code need a higher one: an argument that
  may be \`null\` is level 8, a union with only some members wrong is level 7, and \`mixed\` is level 9 or 10, as in PHPStan.
- **Ignorable** says whether \`@phpstan-ignore\`, \`ignoreErrors\` and baselines can hide it. What PHP itself won't run, such as
  a syntax error, can't be hidden.

The list is generated from the source by \`scripts/gen-reference.mjs\` in the docs repository.

## Levels

| Level | What it adds |
|---|---|
${levelTable.map((l) => l.replace(/^\| (\d+) \|/, '| $1 |')).join('\n')}

Level 1 adds ${[...levels].filter(([, l]) => l === 1).map(([n]) => '`' + byName.get(n).id + '`').join(' and ')}. Without configuration the level is 5, and
\`level: max\` is 10.

## PHPStan's identifiers

| Identifier | Level | Ignorable | |
|---|---|---|---|
${section('phpstan').join('\n')}

## Newer syntax than the project's PHP version

Reported when the project's [PHP version](/guide/php-versions) is older than the syntax.

| Identifier | Level | Ignorable | |
|---|---|---|---|
${section('version').join('\n')}

## StirPHP's own codes

| Code | Level | Ignorable | |
|---|---|---|---|
${section('own').join('\n')}

\`SPHP0080\` is only a hint, for an editor to grey out an unused import; \`stirphp check\` doesn't report it.

## Built as the checker goes

These identifiers are put together from what's found, so they're listed by family.

| Identifiers | Level | Ignorable | |
|---|---|---|---|
${familyRows.join('\n')}

Deprecations are reported by \`stirphp check\` only with \`parameters.stirphp.deprecations: true\`, or when
\`phpstan-deprecation-rules\` is among PHPStan's extensions; then at every level, as warnings. An editor strikes
deprecated names through either way.

## Your own

[Rules](/guide/rules) report under the identifiers they give, such as \`app.noVarDump\`, at every level unless they say
otherwise.
`

// the kinds of node, from `const KINDS` in node.rs
const kindsSrc = nodeRs.slice(nodeRs.indexOf('const KINDS'), nodeRs.indexOf('];', nodeRs.indexOf('const KINDS')))
const kinds = [...kindsSrc.matchAll(/\(\s*"([a-z_]+)",/g)].map((m) => m[1])
if (kinds.length < 10) throw new Error('node.rs: no KINDS found')
const kindsMd = `<!-- Written by scripts/gen-reference.mjs from StirPHP ${version}; don't edit it by hand. -->

${kinds.map((k) => '`' + k + '`').join(', ')}
`

const outputs = [
  [out, md, 'reference/diagnostics.md'],
  [kindsOut, kindsMd, 'guide/parts/node-kinds.md'],
]
if (check) {
  let stale = false
  for (const [path, text, name] of outputs) {
    if (!existsSync(path) || readFileSync(path, 'utf8') !== text) {
      console.error(`${name} is out of date: run npm run gen:reference`)
      stale = true
    }
  }
  if (stale) process.exit(1)
  console.log('the reference is up to date')
} else {
  for (const [path, text] of outputs) {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, text)
  }
  console.log(`wrote reference/diagnostics.md (${consts.length} codes and ${families.reduce((n, f) => n + f.ids.length, 0)} built ones) and guide/parts/node-kinds.md (${kinds.length} kinds)`)
}
