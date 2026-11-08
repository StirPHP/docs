# Editor setup

`stirphp lsp` is a language server, speaking the Language Server Protocol over standard input and output. It offers:

- diagnostics for the project's files, updated as you type, with [PHPStan's](/guide/running-phpstan) on save for a project
  that has it
- hover with types and doc comments
- completion of members, variables and keywords, and of functions, classes and constants from the whole workspace by fuzzy
  match, adding the `use` line a name needs in the right place
- signature help, and inlay hints for inferred types
- go to definition and type definition, including into packages and PHP's own stubs
- go to implementation and declaration, and call and type hierarchies
- find references, highlights, and rename across files
- formatting of a document or a range, with the [formatter](/guide/formatter)
- [quick fixes and refactorings](/guide/code-actions)
- what's deprecated is marked in diagnostics, hover, completion and symbols
- semantic highlighting, document and workspace symbols, folding and selection ranges

It finds the project from the workspace folder as `stirphp check` does, and reads the same
[configuration](/guide/configuration). If a project declares Composer packages that aren't installed, a notice says to run
`composer install`, and until you do, errors about what those packages would declare are held back.

You can try all of this without installing anything in [the editor on this site](/editor).

## VS Code

The extension starts StirPHP when you open a PHP file, and a Composer project needs no configuration. It needs VS Code
1.100 or newer. Install the `stirphp-vscode-<version>.vsix` from the
[releases page](https://github.com/StirPHP/core/releases) with **Extensions: Install from VSIX...**, or:

```sh
code --install-extension stirphp-vscode-<version>.vsix
```

### The language server

The extension downloads `stirphp` itself: on first start it fetches the build for your platform from the releases, checks
it against the release's `SHA256SUMS`, and keeps it in the extension's storage. Every few hours it looks for a newer build
and installs it; you're offered a restart, and the next start uses it anyway. To use your own `stirphp` instead (a local
build, say), set `stirphp.server.path`. If the download fails and there's no earlier build, it falls back to `stirphp` on
the `PATH`.

### VS Code's built-in PHP features

VS Code ships its own basic PHP support, which runs next to this extension. The extension doesn't change your settings, so
with the defaults, `php.suggest.basic` adds VS Code's completions next to StirPHP's (so `strlen` is listed twice), and
`php.validate.enable` runs `php -l` on save, reporting syntax errors twice and needing PHP on your machine. To leave these
to StirPHP:

```json
{
  "php.suggest.basic": false,
  "php.validate.enable": false
}
```

Any other PHP language extension you have enabled also adds its own results.

### Rules and workspace trust

A project's [rules](/guide/rules) are code in the repository, so nothing runs them when you open it:

- In a workspace VS Code doesn't trust (**Workspaces: Manage Workspace Trust**), they never run, and you aren't asked. The
  server restarts when you trust the workspace.
- In a trusted one, the first time you open it you're asked: **Run the N custom rules this workspace configures?** Until
  you answer they don't run.
- Your answer is kept for that folder and those exact scripts, in `trusted-rules.json` under your config directory
  (`~/.config/stirphp` on Linux). When a script changes they stop and you're asked again.

The built-in [framework support](/guide/frameworks) is part of StirPHP, not code from the project, so it runs without
asking.

### PHPStan

If a project has PHPStan's configuration and PHPStan among its Composer packages, the extension can show PHPStan's errors
with StirPHP's, without a second extension and without the same error twice. Running it means running code from the
project, so in an untrusted workspace it never runs, and in a trusted one you're asked first and shown the command,
separately from rules. The answer is kept in `trusted-phpstan.json`, next to `trusted-rules.json`. See
[Running PHPStan alongside](/guide/running-phpstan) for when it runs and what counts as the same error.

### Code actions

The light bulb has the quick fixes for what's under the cursor, and **Refactor...** (`Ctrl+Shift+R`) the refactorings, with
what can't be done where you are listed greyed out with the reason. **Organize Imports** (`Shift+Alt+O`) sorts the `use`
lines and removes what's unused. After **Extract method** and **Extract to a variable**, the new name is selected for
renaming. **Add parameter...** asks what the parameter is. See [Code actions](/guide/code-actions).

To organize imports when you save:

```json
{
  "[php]": {
    "editor.codeActionsOnSave": { "source.organizeImports": "explicit" }
  }
}
```

### Settings

| Setting | Default | |
|---|---|---|
| `stirphp.server.path` | (empty) | the `stirphp` to run instead of the downloaded one: a path or a command on the `PATH` |
| `stirphp.server.channel` | `stable` | download the latest release, or `nightly` (built from every commit on `main`) |
| `stirphp.server.autoUpdate` | `true` | install newer builds of the channel |
| `stirphp.phpstan.enable` | `auto` | run PHPStan on save: `auto` if the project has it set up, `on`, or `off` |
| `stirphp.phpstan.path` | (empty) | the `phpstan` to run instead of `vendor/bin/phpstan`: a path, or a command on the `PATH` |
| `stirphp.phpstan.configuration` | (empty) | PHPStan's configuration, instead of the one it finds by itself |
| `stirphp.phpstan.level` | (empty) | a level or `max`, over the one in its configuration |
| `stirphp.phpstan.memoryLimit` | (empty) | PHP's memory limit per process, as in `--memory-limit`; empty means `2G` |
| `stirphp.phpstan.timeout` | `0` | seconds a run gets; `0` means 600 |
| `stirphp.trace.server` | `off` | how much LSP traffic to log: `verbose` adds message contents |

Commands: **StirPHP: Restart Language Server** and **StirPHP: Check for Updates**. The **StirPHP** output channel logs which
`stirphp` is used.

## Other editors

Any editor that can start a language server for PHP files should work with the command `stirphp lsp`, with no arguments,
for the `php` language, and the project's folder as the workspace. **Only VS Code has been tested.** A configuration for
another editor is untested until someone tries it: if you do, please
[say how it went](https://github.com/StirPHP/core/issues).

What the server takes in `initializationOptions`, all optional:

| Option | |
|---|---|
| `workspaceTrusted` | `false` if the editor knows the workspace isn't trusted: then rules and PHPStan never run |
| `phpstan` | `{enable, path, configuration, level, memoryLimit, timeout}`, as the VS Code settings above |
| `clientCommands` | commands the editor implements: `stirphp.renameAt` (rename at a place after an edit), `stirphp.askParameter` (ask what parameter to add) |

Without `window/showMessageRequest`, the questions about rules and PHPStan can't be asked, so they don't run.

### Neovim

With Neovim 0.11's built-in client, this should be all it takes (untested):

```lua
vim.lsp.config('stirphp', {
  cmd = { 'stirphp', 'lsp' },
  filetypes = { 'php' },
  root_markers = { 'stirphp.neon', 'phpstan.neon', 'phpstan.neon.dist', 'phpstan.dist.neon', 'composer.json', '.git' },
})
vim.lsp.enable('stirphp')
```

### Helix

In `languages.toml` (untested):

```toml
[language-server.stirphp]
command = "stirphp"
args = ["lsp"]

[[language]]
name = "php"
language-servers = ["stirphp"]
```
