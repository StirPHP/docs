// Stands in for `stirphp-web` when `.stirphp-web/` hasn't been built (`npm run web`), so that the
// site still builds; the editor says what's missing.
export function startWorker(): Worker {
  throw new Error("StirPHP's browser build isn't part of this site: build it with `npm run web`.")
}
