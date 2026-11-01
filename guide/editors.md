# Editor support

`sphp lsp` is a language server for `.sphp` (and `.php`) files. It finds the
project from the `sphp.toml` in the workspace folder, or uses the defaults.

It provides:

- diagnostics for every project file, updated as you type
- hover with types (narrowed by smart casts), signatures and doc comments
- go to definition and type definition, into the stdlib and PHP's stubs too
- find references, highlights and rename (which keeps `$` where it belongs)
- completion of members after `->`/`::` (extension functions included),
  locals, functions, classes and keywords
- signature help and inlay type hints for `val`/`var` and lambda parameters
- semantic highlighting: immutable bindings are `readonly`, mutable ones have
  a `mutable` modifier, so a theme can tell them apart
- document and workspace symbols, folding and selection ranges

## VS Code

The extension is in [`editors/vscode`](https://github.com/StirPHP/core/tree/main/editors/vscode)
of the core repository. It registers `.sphp` files, highlights them and starts
`sphp lsp`. Until it is on the Marketplace, build and install it:

```sh
cd editors/vscode
npm install
npm run package
code --install-extension stirphp-0.1.0.vsix
```

| Setting | Default | |
|---|---|---|
| `sphp.server.path` | `sphp` | The binary, started as `sphp lsp` |
| `sphp.php.enable` | `false` | Also serve `.php` files |
| `sphp.trace.server` | `off` | Log LSP traffic |

## Neovim

Neovim 0.11 or later:

```lua
vim.filetype.add({ extension = { sphp = 'sphp' } })
vim.lsp.config('sphp', {
  cmd = { 'sphp', 'lsp' },
  filetypes = { 'sphp', 'php' },
  root_markers = { 'sphp.toml', '.git' },
})
vim.lsp.enable('sphp')
```

## Helix

In `languages.toml`:

```toml
[language-server.sphp]
command = "sphp"
args = ["lsp"]

[[language]]
name = "sphp"
scope = "source.sphp"
file-types = ["sphp"]
roots = ["sphp.toml"]
language-servers = ["sphp"]
```

## Other editors

Any editor with LSP support works the same way: run `sphp lsp` for `.sphp`
files, with the project directory as the workspace root.
