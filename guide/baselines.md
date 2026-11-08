# Baselines

A project with many errors can accept what's reported now, and see only what's new from then on.

<<< @/examples/baseline/output/before.console{text}

<<< @/examples/baseline/output/generate.console{text}

`--generate-baseline` writes `identifier`, `path` and `count` entries, sorted, to `stirphp-baseline.neon` next to the
configuration, or to the path you give it. It makes `parameters.stirphp.baseline` name the file, creating `stirphp.neon`
if there's no configuration:

::: code-group

<<< @/examples/baseline/output/stirphp-baseline.neon{neon} [stirphp-baseline.neon]

<<< @/examples/baseline/output/stirphp.neon{neon} [stirphp.neon]

:::

<<< @/examples/baseline/output/after.console{text}

From then on an error is reported once a file has more of that identifier than its count. Here a third unknown function
was added to `src/legacy.php`, where the baseline allows two:

<<< @/examples/baseline/output/new-error.console{text}

The one shown is the one past the count, in the order they are in the file.

When a file has fewer than its count, because errors were fixed, a warning says which entries can go, as a count left too
high would hide new errors. Here one of the two unknown functions was fixed:

<<< @/examples/baseline/output/fixed.console{text}

Run `--generate-baseline` again to write the baseline as it is now.

## What a baseline can't hold

Errors PHP itself can't run past, such as syntax errors, aren't put in a baseline, and a baseline doesn't hide them.

## The same rules as PHPStan's, and a separate file

The entries are PHPStan's `ignoreErrors`, and they're matched as [`ignoreErrors`](/guide/levels#ignoreerrors) are: on
identifier, path and count, never on the message. So:

- **A PHPStan baseline applies.** Its entries have all three, and their messages are ignored. Include it from the
  configuration, as PHPStan does.
- **StirPHP's baseline is its own.** Name it in `parameters.stirphp.baseline`, never in PHPStan's `includes`: PHPStan would
  apply its entries too, and they'd hide its own errors. StirPHP's own baseline is the only one whose unmatched entries
  it reports.
- The command line and an editor apply it the same way.

When PHPStan [runs alongside](/guide/running-phpstan), each tool applies its own baseline to what it reports.
