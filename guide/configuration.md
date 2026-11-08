# Configuration

All of it is optional. StirPHP looks in the current folder and its parents for `stirphp.neon`, then for PHPStan's
`phpstan.neon`, `phpstan.neon.dist` and `phpstan.dist.neon`, and reads the first it finds. `-c` on the
[command line](/guide/cli) names another. The format is [NEON](https://ne-on.org), as PHPStan's.

There are two kinds of settings in it:

- **PHPStan's parameters**, such as `level`, `paths` and `ignoreErrors`, which mean what they mean to PHPStan.
- **StirPHP's own**, under `parameters.stirphp`.

## StirPHP's settings

Every key of `parameters.stirphp`, with a value that isn't the default:

<<< @/examples/configuration/stirphp.neon{neon}

| Key | Default | |
|---|---|---|
| `srcDir` | the project folder | Where the sources are. |
| `include` | `['**/*.php']` | Globs of source files, relative to `srcDir`. |
| `exclude` | `['vendor/**']` | Globs left out, matched relative to `srcDir` and to the project folder. Giving it replaces the default, so keep `vendor/**` in it. |
| `composer` | `composer.json` in the project folder, if it's there | Where Composer's manifest is. See [Composer](/guide/composer). |
| `baseline` | none | StirPHP's [baseline](/guide/baselines), which `stirphp check --generate-baseline` writes. |
| `rules` | none | The project's [rules and hooks](/guide/rules), as Rhai scripts. |
| `indent` | 4 spaces; in an editor, the editor's | How [`stirphp fmt`](/guide/formatter) indents: `tab`, or a number of spaces from 1 to 16. |
| `deprecations` | `false` | Report the use of what's deprecated, as warnings. See [Deprecations](/guide/phpstan#deprecations). |
| `phpstan` | found out from the project | `true`, `false`, or settings: see [Running PHPStan alongside](/guide/running-phpstan). |
| `frameworks` | found out from the project | Turn a framework's support off or on: `{laravel: false, wordpress: true}`. The names are `laravel`, `symfony` and `wordpress`. See [Frameworks](/guide/frameworks). |

Paths are relative to the file that sets them. An unknown key, or a value of the wrong kind, is an error that names it.

With that configuration, and a rule against `var_dump`, this project:

<<< @/examples/configuration/app/src/Clock.php{php} [app/src/Clock.php]

gets:

<<< @/examples/configuration/output/check.console{text}

## PHPStan's parameters

These are read from the configuration, and from the files it includes, as PHPStan reads them:

| Parameter | |
|---|---|
| `level` | 0 to 10, or `max` (10). Without it, 5. See [Levels](/guide/levels). |
| `paths` | Only files under these are reported. The rest of the project is still read, so what they use is known. |
| `excludePaths` | Left out of what's reported, as a list or as `analyse` and `analyseAndScan`. |
| `ignoreErrors` | See [Ignoring](/guide/levels#ignoreerrors). Entries match on `identifier`, `path` and `count`, never on `message`. |
| `phpVersion` | The [PHP version](/guide/php-versions), as `80300` or `{min: 80100, max: 80400}`. |
| `stubFiles` | What they declare is laid over what's declared elsewhere. |
| `bootstrapFiles`, `scanFiles`, `scanDirectories` | Read for what they declare. Nothing in them is run. |
| `treatPhpDocTypesAsCertain` | With `false`, conditions that can only go one way aren't reported. |
| `tmpDir` | PHPStan's caches, whose `.php` files are never taken for the project's. |
| `symfony.containerXmlPath` | Symfony's compiled container. See [Frameworks](/guide/frameworks#symfony-and-doctrine). |

`includes` are loaded first, relative to the including file, and the including file's settings win, as in PHPStan: lists
are added to, mappings are merged, and `key!:` replaces instead. `%currentWorkingDirectory%` and other parameters are
expanded. Includes written in PHP are skipped, because reading them would run your code, as are includes in `vendor/`
that aren't there yet. Other parameters are accepted and ignored, including `typeAliases`, which isn't used yet.

## Sharing a configuration with PHPStan

PHPStan rejects parameters it doesn't know, so there are two ways to keep both in one place.

**Keep StirPHP's settings in `stirphp.neon`**, and include PHPStan's. StirPHP reads `stirphp.neon` first, so PHPStan's
`level` and `paths` apply to both, and PHPStan never sees `parameters.stirphp`:

::: code-group

<<< @/examples/include-phpstan/stirphp.neon{neon} [stirphp.neon]

<<< @/examples/include-phpstan/phpstan.neon{neon} [phpstan.neon]

:::

<<< @/examples/include-phpstan/output/check.console{text}

Level 8 and `paths` came from `phpstan.neon`: `tests/` was read, but nothing in it was reported.

**Or keep everything in `phpstan.neon`**, and declare `stirphp` in `parametersSchema`, which `stirphp init` does for you.
Real PHPStan accepts this; the [Running PHPStan](/guide/running-phpstan) example runs PHPStan 2.3 with it:

<<< @/examples/with-phpstan/phpstan.neon{neon}

Don't put StirPHP's baseline in PHPStan's `includes`: PHPStan would apply its entries too, and they'd hide its own errors.
Name it in `parameters.stirphp.baseline`, as above.

## Editors

The language server reads the same configuration, from the workspace folder, and reloads it when it changes. The
[VS Code extension's settings](/guide/editors#settings) are only about the extension itself and PHPStan.
