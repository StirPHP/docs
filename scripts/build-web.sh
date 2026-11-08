#!/usr/bin/env sh
# Builds StirPHP's language server for the browser (`editors/web` of the core repository) and
# copies the package to `.stirphp-web/`, where the editor page imports it from.
#
#   STIRPHP_CORE=path/to/core npm run web
#
# Needs Rust with the wasm32-unknown-unknown target, and wasm-pack. With SKIP_WASM_BUILD=1 it
# only copies a package that's been built already (`just web` in the core repository).
set -eu
cd "$(dirname "$0")/.."
core="${STIRPHP_CORE:-../core}"
web="$core/editors/web"
if [ ! -f "$web/package.json" ]; then
    echo "StirPHP's core repository isn't at $core (set STIRPHP_CORE)" >&2
    exit 1
fi
if [ "${SKIP_WASM_BUILD:-}" != 1 ]; then
    # as `just web` does it
    wasm-pack build "$core/crates/stir_wasm" --profile wasm --target web \
        --out-dir ../../editors/web/pkg --no-pack -- --locked
fi
rm -rf .stirphp-web
mkdir -p .stirphp-web/pkg
cp "$web/package.json" "$web/index.js" "$web/index.d.ts" "$web/serve.js" "$web/serve.d.ts" "$web/worker.js" .stirphp-web/
cp "$web/pkg/stir_wasm.js" "$web/pkg/stir_wasm.d.ts" "$web/pkg/stir_wasm_bg.wasm" .stirphp-web/pkg/
echo "stirphp-web $(node -p "require('./.stirphp-web/package.json').version"): $(du -h .stirphp-web/pkg/stir_wasm_bg.wasm | cut -f1) of wasm in .stirphp-web/"
