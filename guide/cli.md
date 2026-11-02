# Command line

```
sphp <COMMAND>

  init    Create a new StirPHP project in the current directory
  check   Type-check the project
  build   Transpile the project to plain PHP
  lsp     Run the language server (over stdin/stdout)
```

`sphp` looks for `sphp.toml` in the current directory and its parents; that
directory is the project root.

## sphp init

```
sphp init [OPTIONS]
```

| Option | |
|---|---|
| `-y`, `--yes` | Accept the defaults (and any flags given) without prompting |
| `-f`, `--force` | Overwrite an existing `sphp.toml` |
| `--name <NAME>` | Project name (defaults to the directory name) |
| `--src-dir <DIR>` | Source directory (default `src`) |
| `--out-dir <DIR>` | Output directory (default `build`) |

Creates `sphp.toml` and `src/main.sphp`, and adds the output directory to
`.gitignore`. An existing `composer.json` or `phpstan.neon` is detected and
reported.

## sphp check

```
sphp check [OPTIONS] [PATHS]...
```

| Option | |
|---|---|
| `[PATHS]...` | Only report diagnostics for files under these paths |
| `--format <human\|json>` | Output format (default `human`) |
| `--no-vendor` | Don't load vendor files from Composer autoload rules |
| `--max-errors <N>` | Show at most N diagnostics (all are still counted) |

Exits with status 1 when there are errors. With `--format json`, each
diagnostic has `file`, `line`, `column`, `endLine`, `endColumn`, `severity`,
`code`, `message`, `labels` and `notes`.

## sphp build

```
sphp build [OPTIONS]
```

| Option | |
|---|---|
| `--out-dir <DIR>` | Output directory (overrides `outDir`) |
| `--inline-extensions` | Inline extension function calls (also `inlineExtensions` in `sphp.toml`) |
| `--no-source-maps` | Don't write `.php.map` source maps |
| `-w`, `--watch` | Rebuild whenever sources or `sphp.toml` change |
| `-f`, `--force` | Write output even if type-checking reports errors |

The output mirrors the source tree. Files that a previous build wrote but no
longer correspond to a source are removed.

With `--force`, a file with syntax errors still isn't written, and the exit
status is still 1.

## sphp lsp

Runs the [language server](./editors) over stdin and stdout. Editors start it
themselves. Set `SPHP_LOG=debug` to log to stderr.
