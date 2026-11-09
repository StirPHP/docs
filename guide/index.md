# What StirPHP is

StirPHP is a language server and type checker for PHP. It reads your `.php` files, their PHPDoc and your Composer
setup as they are, and needs no configuration. It's written in Rust, and the command is `stirphp`.

The goal is the best open source language server for PHP. Paid tools leave people who can't
afford a licence writing code nothing checks, so type safety has to be free, live in the editor, and need no setup.

## What it does

- **Checks types**, following PHPStan's [levels](/guide/levels) and [identifiers](/reference/diagnostics), so
  `@phpstan-ignore`, `ignoreErrors` and baselines written for PHPStan apply.
- **Runs as a language server** for any editor that speaks LSP, with a [VS Code extension](/guide/editors) that downloads
  it for you: diagnostics as you type, hover, completion that adds `use` lines, go to definition into packages and PHP's
  stubs, references, rename, inlay hints, and [quick fixes and refactorings](/guide/code-actions).
- **Reads your project as it is**: [Composer's files](/guide/composer) (it never runs Composer), the
  [PHP version](/guide/php-versions) you target, a `phpstan.neon` if there is one.
- **Knows frameworks**: [Laravel, Symfony and WordPress](/guide/frameworks), built in, and
  [Blade templates](/guide/blade), with variables typed from what renders them.
- **Takes your own rules** as [Rhai scripts](/guide/rules), sandboxed.
- **Formats** code in the style of PER-CS, changing only whitespace: [`stirphp fmt`](/guide/formatter).
- **Runs in a browser** too, compiled to WebAssembly: [try it here](/editor).

It doesn't need PHP installed, and it doesn't run your code. PHPStan, if your project has it, can
[run alongside](/guide/running-phpstan) for what StirPHP doesn't check yet.

## Current state

This is early, and StirPHP still reports some false alarms. If `stirphp check` is wrong about your code, please
[open an issue](https://github.com/StirPHP/core/issues) with a small example.

Not there yet: wrapping long lines when formatting, some of what [frameworks](/guide/frameworks#not-there-yet) need, and
the checks listed under [PHPStan compatibility](/guide/phpstan#limits).

## Where to go next

- [Install it](/guide/installation), then follow the [quick start](/guide/quick-start).
- [Open the editor](/editor) to try it without installing anything.
