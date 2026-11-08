# Installation

StirPHP is one program, `stirphp`, with no dependencies: it doesn't need PHP, Composer or PHPStan to work.

## One line

Linux and macOS, to `~/.local/bin/stirphp`:

```sh
curl -fsSL https://stirphp.github.io/core/install.sh | sh
```

Windows (PowerShell), to `%LOCALAPPDATA%\Programs\stirphp\bin\stirphp.exe`:

```powershell
irm https://stirphp.github.io/core/install.ps1 | iex
```

These install the latest release for your platform, after checking it against the release's `SHA256SUMS`, and need no
admin rights. On Windows the script adds that folder to your user `PATH`; on Linux and macOS, make sure `~/.local/bin` is
on yours.

| Variable | |
|---|---|
| `STIRPHP_VERSION` | a version such as `0.2.0`, or `nightly` for a build of the latest commit; by default the latest release |
| `STIRPHP_INSTALL_DIR` | where to put `stirphp` |
| `STIRPHP_NO_MODIFY_PATH` | on Windows, leave your `PATH` alone |

```sh
curl -fsSL https://stirphp.github.io/core/install.sh | STIRPHP_VERSION=nightly sh
```

The scripts are [`install.sh`](https://github.com/StirPHP/core/blob/main/install.sh) and
[`install.ps1`](https://github.com/StirPHP/core/blob/main/install.ps1), if you'd rather read them first.

## Downloads

Archives for Linux (x86-64 and ARM64, static), macOS (Intel and Apple silicon) and Windows (x86-64 and ARM64) are on the
[releases page](https://github.com/StirPHP/core/releases), with their `SHA256SUMS`. Each has the `stirphp` binary, the
licence and the README.

## VS Code

The extension starts StirPHP when you open a PHP file, and downloads `stirphp` by itself, so you don't need to install it
first. It isn't on the Marketplace yet: download `stirphp-vscode-<version>.vsix` from the
[releases page](https://github.com/StirPHP/core/releases) and install it with **Extensions: Install from VSIX...**, or:

```sh
code --install-extension stirphp-vscode-<version>.vsix
```

It needs VS Code 1.100 or newer. See [Editor setup](/guide/editors) for its settings and for other editors.

## From source

With Rust 1.96 or newer:

```sh
git clone https://github.com/StirPHP/core.git stirphp
cd stirphp
git submodule update --init --depth 1 crates/stir_stubs/phpstorm-stubs
cargo install --path crates/stir_cli
```

The submodule is JetBrains' [phpstorm-stubs](https://github.com/JetBrains/phpstorm-stubs), the declarations of PHP's own
functions and classes, which are built into the binary.

## Check it works

```sh
stirphp --version
```

Then follow the [quick start](/guide/quick-start).
