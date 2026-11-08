# StirPHP documentation

The website of [StirPHP](https://github.com/StirPHP/core), a language server and type checker for PHP: the guide, the
diagnostics reference and an editor running StirPHP in the browser, built with [VitePress](https://vitepress.dev). It's
published at https://stirphp.github.io/docs/.

The rest of this file is about working on the site.

```sh
npm ci
npm run dev        # http://localhost:5173/docs/
npm run build      # .vitepress/dist
```

## The editor

`editor.md` is a [Monaco](https://microsoft.github.io/monaco-editor/) editor connected to StirPHP's language server, which
runs as WebAssembly in a Web Worker: `editors/web` of the core repository. Its code is in `.vitepress/theme/editor/`, and
its sample projects are the folders of `samples/`. To build the language server you need Rust, the
`wasm32-unknown-unknown` target and [wasm-pack](https://github.com/wasm-bindgen/wasm-pack):

```sh
STIRPHP_CORE=../core npm run web                     # builds it, into .stirphp-web/
STIRPHP_CORE=../core SKIP_WASM_BUILD=1 npm run web   # copies what `just web` built in the core repository
```

`.stirphp-web/` isn't committed: it's 15 MB, and it's built from the core release the site describes. Without it the
site still builds, and the editor page says what's missing.

## Examples are run

Every command's output on the site is from a real run. The projects in `examples/` and `samples/` with an
`example.json` are checked with `stirphp`, and the pages include their `output/` files:

```sh
STIRPHP=../core/target/release/stirphp npm run examples              # fail if an output changed
STIRPHP=../core/target/release/stirphp npm run examples -- --update  # save the new outputs
```

`examples/with-phpstan` also needs PHPStan: set `PHPSTAN_HOME` to a folder where `composer install` was run with that
example's `composer.json`. Without it the example is skipped, as it is in CI.

The diagnostics reference, and the list of node kinds rules can visit, are generated from the core's source:

```sh
STIRPHP_CORE=../core npm run gen:reference              # write them
STIRPHP_CORE=../core npm run gen:reference -- --check   # fail if they're out of date
```

## Publishing

`.github/workflows/deploy.yml` checks out StirPHP/core at the tag in `CORE_VERSION`, builds `stirphp` and the browser
build from it, checks the reference and the examples, builds the site and deploys `main` to GitHub Pages. Pull requests
are built and checked without deploying.

To publish with a release of StirPHP:

1. Release StirPHP/core (`just bump`, then push the tag), and wait for its release to finish.
2. Set `CORE_VERSION` to that tag, such as `v0.2.0`.
3. Run `npm run examples` and `npm run gen:reference -- --check` against that release, and commit any new outputs.
4. Push `main`.

For a custom domain, build with `BASE_PATH=/` (and set the domain in the repository's Pages settings).

## Design

The colours are those of the [Raven](https://useraven.org) website.

## License

[MIT](LICENSE).
