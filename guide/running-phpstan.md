# Running PHPStan alongside

A project that has PHPStan can get its full answer in the editor, or from `stirphp check`, with StirPHP's. This runs the
PHPStan the project has installed, with the project's configuration and level. It's there for what StirPHP doesn't have,
such as PHPStan's extensions and the checks StirPHP hasn't got yet, and the same error isn't shown twice.

## On the command line

`stirphp check --with-phpstan` runs it. That's your choice, as running PHPStan by hand would be; `stirphp check` alone
never does. A project with PHPStan 2.3 installed, and this configuration:

<<< @/examples/with-phpstan/phpstan.neon{neon}

<<< @/examples/with-phpstan/src/Cart.php{php}

StirPHP alone:

<<< @/examples/with-phpstan/output/check.console{text}

With PHPStan:

<<< @/examples/with-phpstan/output/with-phpstan.console{text}

PHPStan reported three errors. Its `missingType.return` on line 21 is the same as StirPHP's, so it's shown once, as
StirPHP's. The other two are checks StirPHP doesn't have, and they're marked as PHPStan's. With `--format json` they have
`"source": "phpstan"`:

<<< @/examples/with-phpstan/output/with-phpstan-json.console{text}

If PHPStan can't give an answer, what StirPHP found is still shown, the reason goes to standard error, and the exit code
is 1. `--level` and `-c` are passed on, except that a `stirphp.neon` isn't, since PHPStan refuses `parameters.stirphp`
unless that's declared. It can't be combined with `--generate-baseline`.

## In an editor

It's on for a project with both PHPStan's configuration (`phpstan.neon`, `phpstan.neon.dist` or `phpstan.dist.neon`, in the
project's folder) and PHPStan among its Composer packages, once you've said it can run. Running it means running code
from the project: the `vendor/bin/phpstan` that's there, and the bootstrap files and extensions its configuration loads.
So you're asked first, and shown the command, separately from [rules](/guide/rules), as PHPStan has no sandbox.

- The answer is kept for that workspace, for that binary and that configuration file as they are, and you're asked again
  when either changes. What's in bootstrap files, extensions, included files and `vendor/` isn't part of it, so a change
  there doesn't ask again.
- In a workspace the editor doesn't trust (`"workspaceTrusted": false` in `initializationOptions`), it never runs and
  nothing's asked. A client that can't ask gets one notice, and it doesn't run.
- **When it runs:** when the project is opened, and whenever a PHP file of the project is saved in the editor, never as you
  type. A change made elsewhere, such as `git pull`, is noticed at the next save. It analyses what `phpstan analyse` would,
  not only the saved file, since a change in one file can cause errors in others.
- **One at a time:** a save during a run waits for it, and then there's one more run, however many saves there were. A run
  isn't stopped for a save, because a stopped run leaves no result cache. It's stopped, with all its worker processes, when
  it takes too long, when the settings or configuration change, and when the server stops.
- **Stale lines:** PHPStan reads files from disk and only gives line numbers. So what it said of a file is only shown while
  the editor has the text it read: type in a file and PHPStan's errors in it go away until the next save's run is done.
  StirPHP's own stay and keep up.
- **Failures:** if it's not there, crashes, runs out of memory or time, has a broken configuration or a PHP it can't run on,
  you get one notice, and no more of that kind until it's worked again. What it said before stays until it says something
  else, and StirPHP's diagnostics carry on regardless.
- **Results:** errors have the source `phpstan` and link to [PHPStan's page for the
  identifier](https://phpstan.org/error-identifiers). They cover the line, as that's all PHPStan gives. Errors about the run
  as a whole, such as an ignore pattern that matched nothing, show up at the top of its configuration file.

## Which PHPStan, and its settings

`parameters.stirphp.phpstan.binary` or an editor's setting (which wins), then Composer's `vendor/bin/phpstan` (or its
`bin-dir`), then the package's own script. Never one that's only on your `PATH` unless you name it, and StirPHP never
installs anything. All of these are optional:

<<< @/examples/phpstan-settings/stirphp.neon{neon}

`phpstan: true` and `phpstan: false` are short for `enabled`. In VS Code the same settings are `stirphp.phpstan.*`: see
[Editor setup](/guide/editors#settings).

## Duplicates

- Two reports are the same if they have the same file, line and identifier. Messages play no part. StirPHP's stays,
  because it has a real range and keeps up as you type. For what's wrong in a doc comment, either the comment's line or the
  line of what it documents counts, because PHPStan reports the latter. A syntax error counts as the same as PHPStan's
  `phpstan.parse` anywhere in the file.
- One of StirPHP's removes one of PHPStan's. Two on a line with one identifier may be different errors.
- A report with no identifier is never a duplicate. Neither is a report with one of StirPHP's own codes, such as
  `SPHP0061`, so PHPStan's error about the same thing under another identifier is shown too. Nor are the same error on
  different lines, as with a call over several lines.
- What StirPHP reports and PHPStan doesn't stays. PHPStan's silence doesn't take anything away, and the checks don't all
  agree yet.

Baselines and ignore rules don't cross over. PHPStan applies its own to what it reports, and StirPHP's apply to what
StirPHP reports. So an error StirPHP's baseline hides still shows if PHPStan reports it, unless PHPStan's baseline has it
too, and `// @stirphp-nocheck` only quiets StirPHP.

## How long it takes

On Laravel's framework with its own configuration (level 1), on 16 cores: 6 seconds for a first run, with 17 processes of
up to 420 MB each, and under a second with PHPStan's result cache when nothing or a little changed. On that project, 1593
of PHPStan's 2884 errors were removed as duplicates.
