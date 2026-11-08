# Levels and ignoring

## Levels

The levels follow PHPStan's, 0 to 10, and each adds to the one below:

| Level | What it adds |
|---|---|
| 0 | unknown classes, functions, constants and variables, members on `$this`, wrong argument counts on it, static access, syntax |
| 1 | `constant.notFound` and `nullCoalesce.variable` |
| 2 | the same on any other value, PHPDoc validation (PHPDoc against native types, generic arity, bounds, variance), visibility, invalid operators and callables |
| 3 | return types, property types, other assignments, PHPDoc types of overrides, iterating and indexing, writes to readonly properties |
| 4 | code nothing can reach, and conditions and comparisons that can only go one way |
| 5 | argument types |
| 6 | types left out: of parameters, returns and properties, and of what arrays hold |
| 7 | what can be right but isn't always: unions with a right member, `object` for a class, `string` for a `non-empty-string` |
| 8 | nullable values, as arguments and when reached through |
| 9 | explicit `mixed` |
| 10 | implicit `mixed`: no type at all |

Without configuration it's level 5. Set it with `level` in the [configuration](/guide/configuration) (`max` means 10), or
`--level` on the command line, which wins. The [diagnostics reference](/reference/diagnostics) gives the level of each
identifier.

A report of an identifier can need a higher level than the identifier's own: an `argument.type` is level 5, but a value
that may be `null` passed where it can't be is level 8, as in PHPStan.

## In the code

PHPStan's comments work, with the same rules:

<<< @/examples/ignoring/src/comments.php{php}

- `// @phpstan-ignore return.type` on the line, or on the line before, hides that identifier there. Several are separated
  by commas.
- `@phpstan-ignore-line` and `@phpstan-ignore-next-line` hide everything on the line.
- An identifier that doesn't match doesn't silence the line. Above, `height()` is still reported, because its error is a
  `return.type`, not an `argument.type`.

Errors PHP itself can't run past, such as syntax errors, can't be ignored. The
[reference](/reference/diagnostics) says which.

A file with `// @stirphp-nocheck` in its leading comments isn't checked for types at all, though what it declares is still
known.

## `ignoreErrors`

PHPStan's `ignoreErrors` apply, matched on identifier, path and count, and never on the message, because StirPHP's
messages differ from PHPStan's (and may be translated one day):

- An entry with `identifier`, `path` and `count` hides up to that many of that identifier in that file. `identifiers` and
  `paths` take several.
- An entry with only an `identifier` hides it everywhere.
- An entry with only a `message`, or a `message` and an `identifier` but no `path`, is skipped, and a notice gives the number
  skipped.

<<< @/examples/ignoring/phpstan.neon{neon}

<<< @/examples/ignoring/src/legacy.php{php} [src/legacy.php]

<<< @/examples/ignoring/output/check.console{text}

The `count` of 2 hid the first two unknown functions, so the third shows. The `class.notFound` was hidden everywhere, and
the entry with a message was skipped, with the notice at the top.

A [baseline](/guide/baselines) is a list of such entries, written for you.
