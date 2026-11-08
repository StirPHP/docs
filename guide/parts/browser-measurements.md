Measured on the build of this site, served locally with gzip as GitHub Pages serves it, in Firefox on a desktop machine
(16 cores), with the `basics` sample:

| | |
|---|---|
| the language server, `stir_wasm_bg.wasm` | 14.7 MB; 3.4 MB with gzip (what GitHub Pages sends), 2.4 MB with brotli. About 10 MB of it is PHP's stubs. |
| Monaco and the editor's code | 4.0 MB; 0.8 MB with gzip |
| Monaco's worker, and its icon font | 0.3 MB and 0.15 MB; 70 KB and 150 KB sent |
| every other page of the site | none of the above |
| opening the page to the first diagnostics | about 1.1 s on localhost, once Firefox has compiled the code before; the first time, several seconds |
| the server's WebAssembly memory | about 86 MB |

On a real connection the download dominates: about 4.4 MB with gzip the first time, then the browser's cache. Pages other
than this one load none of it.
