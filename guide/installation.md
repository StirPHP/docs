# Installation

## Install script

On Linux and macOS:

```sh
curl -fsSL https://stirphp.github.io/core/install.sh | sh
```

On Windows, in PowerShell:

```powershell
irm https://stirphp.github.io/core/install.ps1 | iex
```

The script picks the build for your platform, downloads the latest release,
checks it against the release's `SHA256SUMS` and installs `sphp` without admin
rights: to `~/.local/bin` on Linux and macOS, and to
`%LOCALAPPDATA%\Programs\sphp\bin` on Windows, where it also adds that directory
to your user `PATH`. On Linux and macOS, it tells you what to add to your shell
profile if the directory isn't on your `PATH`.

| Variable | |
|---|---|
| `SPHP_VERSION` | A version such as `0.1.1`, or `nightly` (default: the latest release) |
| `SPHP_INSTALL_DIR` | Where to put `sphp` |
| `SPHP_NO_MODIFY_PATH` | Windows: set it to leave your `PATH` alone |

Set them for the shell that runs the script:

```sh
curl -fsSL https://stirphp.github.io/core/install.sh | SPHP_VERSION=nightly sh
```

To read the scripts first, they are
[`install.sh`](https://github.com/StirPHP/core/blob/main/install.sh) and
[`install.ps1`](https://github.com/StirPHP/core/blob/main/install.ps1).

## Prebuilt binaries

To install by hand, every [release](https://github.com/StirPHP/core/releases) has
`sphp` for:

| Platform | Archive |
|---|---|
| Linux x86_64 | `sphp-x86_64-unknown-linux-musl.tar.gz` |
| Linux arm64 | `sphp-aarch64-unknown-linux-musl.tar.gz` |
| macOS Intel | `sphp-x86_64-apple-darwin.tar.gz` |
| macOS Apple silicon | `sphp-aarch64-apple-darwin.tar.gz` |
| Windows x86_64 | `sphp-x86_64-pc-windows-msvc.zip` |
| Windows arm64 | `sphp-aarch64-pc-windows-msvc.zip` |

Each also comes with the version in its name (`sphp-0.1.1-x86_64-...`). The Linux
binaries are statically linked (musl), so they run on any distribution, whatever
its glibc. `releases/latest/download/<archive>` always gets the newest release.

Each release also lists `SHA256SUMS` for the archives, and the VS Code
extension as a `.vsix` (see [Editor support](./editors)).

### Nightly builds

The [`nightly`](https://github.com/StirPHP/core/releases/tag/nightly)
prerelease is rebuilt from every commit on `main`, with stable file names
(`sphp-nightly-<target>`). The install script can fetch it:

```sh
curl -fsSL https://stirphp.github.io/core/install.sh | SPHP_VERSION=nightly sh
```

`sphp --version` tells which commit a nightly was built from. Nightlies may be
broken; use them to try a fix before it is released.

## From source

You need [Rust](https://rustup.rs) (rustup; the repository pins the toolchain
it needs) and Git:

```sh
git clone https://github.com/StirPHP/core stirphp
cd stirphp
git submodule update --init --depth 1 crates/stir_stubs/phpstorm-stubs
cargo install --path crates/stir_cli
```

The submodule holds JetBrains' [phpstorm-stubs](https://github.com/JetBrains/phpstorm-stubs),
the signatures of PHP's functions and classes, which are compiled into the
binary. The repository's other submodules are test corpora you don't need.

To update, `git pull`, update the submodule the same way and run
`cargo install --path crates/stir_cli` again.

## Running the output

What StirPHP generates needs PHP 8.4 or later.

## Editor support

`sphp` includes a language server. To set up VS Code, Neovim or Helix, see
[Editor support](./editors).

Next: [Your first project](./first-project).
