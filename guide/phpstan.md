# PHPStan compatibility

StirPHP is its own engine, and it doesn't need PHP installed or PHPStan to work. It follows PHPStan where that helps a
project move between the two, or use both: if a project has PHPStan, it can [run alongside](/guide/running-phpstan).

## What's shared

- **Configuration:** `level`, `paths`, `excludePaths`, `ignoreErrors`, `phpVersion`, `stubFiles`, `bootstrapFiles`,
  `scanFiles`, `scanDirectories`, `treatPhpDocTypesAsCertain` and `includes` are read from NEON. Includes written in PHP are
  skipped, because reading them would run your code. See [Configuration](/guide/configuration#phpstan-s-parameters).
- **Levels:** 0 to 10, with what each adds following PHPStan's. See [Levels](/guide/levels).
- **Identifiers:** a check that means the same as a PHPStan rule reports PHPStan's identifier, such as `return.type` or
  `function.notFound`. Checks only StirPHP has report codes such as `SPHP0061`. Rule levels come from these. The
  [reference](/reference/diagnostics) lists them.
- **Ignoring:** `@phpstan-ignore return.type` on the line or the line before, `@phpstan-ignore-line` and
  `@phpstan-ignore-next-line`. As in PHPStan, an identifier that doesn't match doesn't silence the line.
- **Ignore rules and baselines:** matched on identifier, path and count, never on the message. A PHPStan baseline applies.
  See [Ignoring](/guide/levels#ignoreerrors) and [Baselines](/guide/baselines).
- **PHPDoc:** PHPStan's types and tags, such as generics, array shapes, conditional types, `@template`, `@phpstan-assert`,
  `@mixin`, `@throws` and the other `@phpstan-*` tags.
- **Stubs:** what a stub file says of a class is laid over the class, method by method, and a function in one replaces the
  function. PHPStan's stubs for PHP's own classes are built in, so `FilterIterator<K, V, I>` and the like are generic.

## Deprecations

With `parameters.stirphp.deprecations: true`, or `phpstan-deprecation-rules` among the configured extensions, what's
marked `@deprecated` or `#[Deprecated]` is a warning with that package's identifiers (`function.deprecated`,
`method.deprecated`, `new.deprecatedClass` and so on). Without that, `stirphp check` says nothing about it, and an editor
strikes it through either way. The [Configuration](/guide/configuration#stirphp-s-settings) page has an example.

## Limits

- **Extensions and custom rules written for PHPStan are PHP code**, which can't run in this engine. StirPHP has its own
  support for [Laravel, Symfony and WordPress](/guide/frameworks), covering part of what larastan, phpstan-symfony,
  phpstan-doctrine and phpstan-wordpress do. For the rest, and for others such as strict rules,
  [run PHPStan alongside](/guide/running-phpstan), or write what a project needs as [rules and hooks](/guide/rules).
- **The checks don't all exist yet**, and those that exist don't always agree with PHPStan. Conditions and comparisons that
  can only go one way are reported only where that's certain, so some are missed. A project with
  `treatPhpDocTypesAsCertain: false` gets none of them, because types here don't say which came from PHPDoc.
- **Not reported at all:** `missingType.generics`, `missingType.callable` and `missingType.checkedException`.
- **Messages differ** from PHPStan's, which is why nothing is matched on them.
- **Not read:** PHPStan's `typeAliases` parameter.
