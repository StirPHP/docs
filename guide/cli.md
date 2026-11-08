# Command line

```text
Usage: stirphp <COMMAND>

Commands:
  check  Type-check the project
  fmt    Format PHP files, in the style of PER-CS
  init   Write a configuration, or add to the PHPStan one the project has
  lsp    Run the language server (over stdin/stdout)
  help   Print this message or the help of the given subcommand(s)
```

Every command finds the project from the current folder: the nearest folder at or above it with a configuration
(`stirphp.neon`, or PHPStan's `phpstan.neon`, `phpstan.neon.dist` or `phpstan.dist.neon`), or else with `composer.json`.
Without either, the current folder is the project.

## `stirphp check`

```sh
stirphp check                       # the whole project
stirphp check src/Foo.php tests     # report only for these paths
stirphp check --level 8             # rule level, 0 to 10, over the one in the configuration
stirphp check -c ci.neon            # use this configuration
stirphp check --generate-baseline   # accept what's reported now
stirphp check --format json         # one JSON array of diagnostics
stirphp check --max-errors 20       # show at most 20; all are still counted
stirphp check --no-vendor           # don't load Composer's packages
stirphp check --with-phpstan        # run the project's PHPStan too
```

| Option | |
|---|---|
| `[PATHS]...` | Only report diagnostics for files under these paths. The whole project is still read, so what they use is known. |
| `-l`, `--level <LEVEL>` | The [rule level](/guide/levels), 0 to 10, over the one in the configuration. |
| `-c`, `--configuration <FILE>` | The configuration, instead of `stirphp.neon` or PHPStan's in the project folder. |
| `--format <FORMAT>` | `human` (the default) or `json`. |
| `--max-errors <N>` | Show at most N diagnostics. All are still counted, and the exit code is the same. |
| `--no-vendor` | Don't load what Composer's autoload rules point at in `vendor/`. |
| `--generate-baseline [<PATH>]` | Write what's reported now to a [baseline](/guide/baselines), by default `stirphp-baseline.neon` next to the configuration, and make `parameters.stirphp.baseline` name it. |
| `--with-phpstan` | Run the project's PHPStan too, and show what it reports with StirPHP's, without the same error twice. This runs the project's code: PHPStan, and what its configuration loads. See [Running PHPStan alongside](/guide/running-phpstan). |

It exits with 1 when it reports an error, or when `--with-phpstan` couldn't get PHPStan's answer, and with 0 otherwise.
Warnings don't change the exit code.

The human format shows each diagnostic with its identifier and where it is:

<<< @/examples/quick-start/output/check.console{text}

The JSON format has one object for each, with `file` (relative to the project), `line`, `column`, `endLine` and
`endColumn` (from 1), `severity` (`error`, `warning` or `hint`), `code`, `message`, `labels` and `notes`, and
`"source": "phpstan"` on what PHPStan reported. The summary line goes to standard error:

<<< @/examples/quick-start/output/check-json.console{text}

A file with `// @stirphp-nocheck` in its leading comments isn't checked for types, though what it declares is still known.

## `stirphp fmt`

```sh
stirphp fmt                  # the project's sources
stirphp fmt src tests/A.php  # these files and folders
stirphp fmt --check          # change nothing, list what would change, and fail if anything would
stirphp fmt --indent tab     # or a number of spaces, over `parameters.stirphp.indent`
stirphp fmt -                # from standard input to standard output
```

| Option | |
|---|---|
| `[PATHS]...` | Files and folders to format, `-` for standard input; by default the project's sources. |
| `--check` | Change nothing: list the files that would change, and exit with 1 if there are any. |
| `--indent <INDENT>` | `tab`, or how many spaces to a level, over what the project's configuration says. |

What it changes, and what it leaves alone, is on the [Formatter](/guide/formatter) page.

## `stirphp init`

Writes a configuration, or adds StirPHP's section to the PHPStan one the project has.

| Option | |
|---|---|
| `--phpstan` | Keep the settings in PHPStan's configuration, creating `phpstan.neon` if there's none. |

In a project without a configuration it creates `stirphp.neon`:

<<< @/examples/init/output/init.console{text}

<<< @/examples/init/output/stirphp.neon{neon}

In a project with `phpstan.neon`, it adds `parameters.stirphp` there, with the `parametersSchema` entry PHPStan needs to
accept it. PHPStan's own settings are left as they were:

<<< @/examples/init-phpstan/output/init.console{text}

<<< @/examples/init-phpstan/output/phpstan.neon{neon}

Run again, it says the configuration is set up already, and changes nothing.

## `stirphp lsp`

Runs the [language server](/guide/editors), speaking the Language Server Protocol over standard input and output. It
takes no options; an editor starts it.

## Environment

| Variable | |
|---|---|
| `STIRPHP_LOG` | What's logged to standard error: `info`, `debug`, or a filter such as `stirphp::script=debug` for what [scripts](/guide/rules) `print`. |
| `NO_COLOR` | Set and not empty, the output has no colours. There are none anyway when it isn't going to a terminal. |
