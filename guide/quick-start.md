# Quick start

There's nothing to set up. From a project's folder:

```sh
composer install    # if it's a Composer project; StirPHP reads the result, and never runs Composer
stirphp check
```

Without configuration it checks every `.php` file under the folder except `vendor/`, at [level](/guide/levels) 5. It exits
with 1 if it reports errors, and with 0 otherwise.

## An example

Two files with mistakes in them:

::: code-group

<<< @/examples/quick-start/src/Invoice.php [src/Invoice.php]

<<< @/examples/quick-start/src/report.php [src/report.php]

:::

<<< @/examples/quick-start/output/check.console{text}

Each error has an identifier, here `method.notFound` and `return.type`. They're PHPStan's, where PHPStan has a check that
means the same, so `// @phpstan-ignore return.type` and PHPStan's baselines work on them. The
[diagnostics reference](/reference/diagnostics) lists them all.

`str_repeat('-', $width)` isn't reported, because `$width` may be `null`, and level 5 lets that pass. Level 8 doesn't:

<<< @/examples/quick-start/output/check-level-8.console{text}

## For a script or CI

`--format json` prints one JSON array, and the summary goes to standard error. `--max-errors` limits what's shown, but
every error still counts:

<<< @/examples/quick-start/output/check-json.console{text}

## Next

- Keep the level in a [configuration](/guide/configuration), or let `stirphp init` write one.
- An existing project with many errors can start from a [baseline](/guide/baselines), so only new ones are reported.
- If the project has PHPStan, its configuration is read already: see [PHPStan compatibility](/guide/phpstan).
- Get the same in your [editor](/guide/editors).
