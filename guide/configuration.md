# Configuration

A project is configured by `sphp.toml` at its root. Every key is optional.

```toml
name = "my-app"
srcDir = "src"
outDir = "build"
include = ["**/*.sphp", "**/*.php"]
exclude = ["vendor/**"]
allowPhp = true
checkPhp = false
inlineExtensions = false
# phpstan = "phpstan.neon"
# composer = "composer.json"
```

| Key | Default | |
|---|---|---|
| `name` | directory name | Informational |
| `srcDir` | `"src"` | Where sources are, relative to the project root |
| `outDir` | `"build"` | Where `sphp build` writes PHP |
| `include` | `["**/*.sphp", "**/*.php"]` | Globs of source files, relative to `srcDir` |
| `exclude` | `["vendor/**"]` | Globs to leave out, relative to the root or `srcDir` |
| `allowPhp` | `true` | Plain `.php` files under `srcDir` are part of the project |
| `checkPhp` | `false` | Type-check `.php` files (a file can opt in or out with `// @sphp-check` / `// @sphp-nocheck`) |
| `inlineExtensions` | `false` | Inline calls to extension functions in the output |
| `phpstan` | `phpstan.neon` or `phpstan.neon.dist` at the root, if present | PHPStan configuration whose `level` and `ignoreErrors` apply to `.php` files |
| `composer` | `composer.json` at the root, if present | Its autoload rules decide which dependency files are loaded |

## phpstan.neon

StirPHP reads PHPStan's configuration format (NEON) itself, including
`includes`. These parameters are used:

```yaml
parameters:
    level: 6
    ignoreErrors:
        - '#^Call to an undefined method#'
        -
            identifier: SPHP0007
            path: src/legacy.php
```

`level` (0 to 9, or `max`) chooses which diagnostics are reported in `.php`
files, following PHPStan's levels. `ignoreErrors` entries can match a
message (`message`, as a regex, or `rawMessage`), a StirPHP diagnostic code
(`identifier`) and paths.
