// The sample projects of the editor: the folders of `samples/`, as text. Their `example.json`
// and `output/` are for `npm run examples`, which checks them with the real `stirphp`.

import { ROOT, type Files } from './session'

const raw = import.meta.glob(
  ['../../../samples/*/**', '!../../../samples/*/output/**', '!../../../samples/*/example.json'],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

export interface Sample {
  id: string
  title: string
  about: string
  /** Opened first, the first of them shown. */
  open: string[]
}

export const SAMPLES: Sample[] = [
  {
    id: 'basics',
    title: 'A small shop',
    about:
      'A small Composer project with no configuration, and some mistakes: a misspelt method, wrong argument types, a class that isn\'t imported.',
    open: ['src/Shop/Cart.php', 'public/index.php', 'src/Receipt.php'],
  },
  {
    id: 'rules',
    title: 'Configuration and rules',
    about:
      'A stirphp.neon with three Rhai scripts: a rule against var_dump, one against unfinished names, and a hook that gives a container\'s get() the class it was asked for.',
    open: ['src/main.php', 'stirphp.neon', 'rules/container_return_type.rhai'],
  },
  {
    id: 'laravel',
    title: 'Laravel',
    about:
      'Models, a migration, a scope and a controller. vendor/ has a few of Laravel\'s classes, written for this sample, so the framework support turns on.',
    open: ['app/Http/Controllers/PostController.php', 'app/Models/Post.php'],
  },
]

/** The files of a sample, by their path in the editor's project. */
export function sampleFiles(id: string): Files {
  const prefix = `../../../samples/${id}/`
  const out: Files = {}
  for (const [path, text] of Object.entries(raw)) {
    if (path.startsWith(prefix)) out[`${ROOT}/${path.slice(prefix.length)}`] = text
  }
  return out
}

/**
 * The project's configuration, `neon` as the sample has it, with the level and PHP version the
 * toolbar chose, written as PHPStan's `level` and `phpVersion` parameters: `null` leaves the
 * project's own. `null` if there's no configuration.
 */
export function withChoices(neon: string | undefined, level: string | null, php: string | null): string | null {
  const lines = (neon ?? '').split('\n')
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
  let at = lines.findIndex((l) => /^parameters:\s*$/.test(l))
  if (at < 0) {
    if (level === null && php === null) return neon ?? null
    if (lines.length > 0) lines.push('')
    lines.push('parameters:')
    at = lines.length - 1
  }
  // the parameters' indentation, from the line after `parameters:`
  const indent = lines[at + 1]?.match(/^(\s+)\S/)?.[1] ?? '    '
  let end = at + 1
  while (end < lines.length && (lines[end].trim() === '' || /^\s/.test(lines[end]))) end++
  const replaced = [level !== null && 'level', php !== null && 'phpVersion'].filter(Boolean)
  const body = lines
    .slice(at + 1, end)
    .filter((l) => !replaced.some((key) => l.startsWith(`${indent}${key}:`)))
  const chosen: string[] = []
  if (level !== null) chosen.push(`${indent}level: ${level}`)
  if (php !== null) {
    const [major, minor] = php.split('.').map(Number)
    chosen.push(`${indent}phpVersion: ${major * 10000 + minor * 100}  # PHP ${php}, from the editor's toolbar`)
  }
  const out = [...lines.slice(0, at + 1), ...chosen, ...body, ...lines.slice(end)]
  // a `parameters:` left with nothing under it
  if (chosen.length === 0 && body.every((l) => l.trim() === '')) out.splice(at, 1 + body.length)
  const text = out.join('\n').replace(/^\n+/, '')
  return text.trim() === '' ? null : text + '\n'
}
