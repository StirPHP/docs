# StirPHP documentation

The website of [StirPHP](https://github.com/StirPHP/core): the guide and an
in-browser playground, built with [VitePress](https://vitepress.dev). It is
published at https://stirphp.github.io/docs/.

To install StirPHP itself:

```sh
curl -fsSL https://stirphp.github.io/core/install.sh | sh     # Linux and macOS
irm https://stirphp.github.io/core/install.ps1 | iex          # Windows (PowerShell)
```

The rest of this file is about working on the site.

```sh
npm install
npm run dev        # http://localhost:5173/docs/
npm run build      # .vitepress/dist
```

## The playground

The playground runs the real StirPHP checker and compiler in the browser:
`crates/stir_wasm` of the core repository, built to WebAssembly, with
[Monaco](https://microsoft.github.io/monaco-editor/) as the editor. To build
it locally you need Rust, the `wasm32-unknown-unknown` target and
[wasm-pack](https://github.com/wasm-bindgen/wasm-pack):

```sh
STIRPHP_CORE=../core ./scripts/build-playground.sh   # writes public/playground/
```

Without it the site still builds; only the playground page can't load.

## Examples are checked

Every ```` ```sphp ```` block in the guide, and the playground's example
programs, is type-checked with the real compiler:

```sh
npm run check:examples          # uses `sphp` on PATH, or $SPHP
```

A block passes when its diagnostics are exactly the ones it marks with
trailing `// error: SPHP0005` comments. Precede a block with
`<!-- no-check -->` to skip it.

## Publishing

`.github/workflows/deploy.yml` builds the compiler from `StirPHP/core`,
checks the examples, builds the site and deploys `main` to GitHub Pages.
Pull requests are built and checked without deploying.

For a custom domain, build with `BASE_PATH=/` (and set the domain in the
repository's Pages settings).

## Design

The colors are those of the [Raven](https://useraven.org) website.

## License

[MIT](LICENSE).
