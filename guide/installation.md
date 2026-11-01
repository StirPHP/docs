# Installation

StirPHP is built from source for now. You need:

| Requirement | Used for |
|---|---|
| Git | Getting the source |
| [Rust](https://rustup.rs) (rustup) | Building the `sphp` binary; the repository pins the toolchain it needs |
| PHP 8.4 or later | Running what StirPHP generates |

## Build and install

```sh
git clone https://github.com/StirPHP/core stirphp
cd stirphp
git submodule update --init --depth 1 crates/stir_stubs/phpstorm-stubs
cargo install --path crates/stir_cli
```

The submodule holds JetBrains' [phpstorm-stubs](https://github.com/JetBrains/phpstorm-stubs),
the signatures of PHP's functions and classes, which are compiled into the
binary. The repository's other submodules are test corpora you don't need.

`cargo install` puts `sphp` in `~/.cargo/bin`. Check that it is on your `PATH`:

```sh
sphp --version
```

## Update

```sh
cd stirphp
git pull
git submodule update --depth 1 crates/stir_stubs/phpstorm-stubs
cargo install --path crates/stir_cli
```

## Editor support

`sphp` includes a language server. To set up VS Code, Neovim or Helix, see
[Editor support](./editors).

Next: [Your first project](./first-project).
