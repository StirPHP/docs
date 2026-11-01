# Installation

## Prebuilt binaries

Every [release](https://github.com/StirPHP/core/releases) has `sphp` for:

| Platform | Archive |
|---|---|
| Linux x86_64 | `sphp-<version>-x86_64-unknown-linux-musl.tar.gz` |
| Linux arm64 | `sphp-<version>-aarch64-unknown-linux-musl.tar.gz` |
| macOS Intel | `sphp-<version>-x86_64-apple-darwin.tar.gz` |
| macOS Apple silicon | `sphp-<version>-aarch64-apple-darwin.tar.gz` |
| Windows x86_64 | `sphp-<version>-x86_64-pc-windows-msvc.zip` |
| Windows arm64 | `sphp-<version>-aarch64-pc-windows-msvc.zip` |

The Linux binaries are statically linked (musl): they run on any
distribution, whatever its glibc.

On Linux or macOS:

```sh
curl -fsSL https://github.com/StirPHP/core/releases/latest/download/sphp-x86_64-unknown-linux-musl.tar.gz \
  | tar -xz
sudo mv sphp-*-x86_64-unknown-linux-musl/sphp /usr/local/bin/
sphp --version
```

Replace the target with your platform's from the table. Every release also
has these version-less names, so the `latest/download` links always get the
newest release.

On Windows, unpack the `.zip` and put `sphp.exe` in a directory on your
`PATH`.

Each release also lists `SHA256SUMS` for the archives, and the VS Code
extension as a `.vsix` (see [Editor support](./editors)).

### Nightly builds

The [`nightly`](https://github.com/StirPHP/core/releases/tag/nightly)
prerelease is rebuilt from every commit on `main`, with stable file names:

```sh
curl -fsSL https://github.com/StirPHP/core/releases/download/nightly/sphp-nightly-x86_64-unknown-linux-musl.tar.gz \
  | tar -xz
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
