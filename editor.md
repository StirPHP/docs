---
layout: page
title: Editor
---

<div class="editor-page">

# Editor

StirPHP's language server, compiled to WebAssembly and running in your browser, with a sample project. Errors appear as
you type; hover, completion, go to definition (`F12`), references (`Shift+F12`), rename (`F2`), quick fixes (`Ctrl+.`)
and formatting work as they do in an editor. Choosing a PHP version or a level writes it to `stirphp.neon`. Nothing is
sent anywhere. See [In the browser](/guide/browser) for how it's built.

<ClientOnly>
  <StirEditor />
</ClientOnly>

</div>
