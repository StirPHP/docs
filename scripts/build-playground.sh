#!/usr/bin/env sh
# Builds StirPHP for the browser (crates/stir_wasm of StirPHP/core) and copies
# it to public/playground/, where the playground page loads it from.
#
#   STIRPHP_CORE=path/to/core ./scripts/build-playground.sh
#
# Needs Rust with the wasm32-unknown-unknown target, and wasm-pack.
set -eu
cd "$(dirname "$0")/.."
core="${STIRPHP_CORE:-../core}"
if [ ! -f "$core/crates/stir_wasm/Cargo.toml" ]; then
    echo "StirPHP core not found at $core (set STIRPHP_CORE)" >&2
    exit 1
fi
wasm-pack build "$core/crates/stir_wasm" --target web --release --out-dir pkg --no-typescript
mkdir -p public/playground
cp "$core/crates/stir_wasm/pkg/stir_wasm.js" "$core/crates/stir_wasm/pkg/stir_wasm_bg.wasm" public/playground/
echo "playground: $(du -h public/playground/stir_wasm_bg.wasm | cut -f1) of wasm in public/playground/"
