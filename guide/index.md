# Introduction

StirPHP is to PHP what TypeScript is to JavaScript: a strictly typed superset
that compiles to the language you already deploy. You write `.sphp` files, the
checker proves them consistent, and the compiler emits ordinary PHP 8.4, with
PHPDoc that PHPStan understands.

```sphp
const GREETING = "Hello"

function greet(name: String, mut times: Int = 1): String {
    var $out = ""
    while (times > 0) {
        $out .= "${GREETING}, ${name}! "
        times -= 1
    }
    return $out
}

val message = greet("world", 2)
echo message
```

## What StirPHP adds

- **A type system that means it.** StirPHP's own types (`Int`, `String`,
  `List<T>`, ...) never coerce, null is a separate type, and there is no top
  type to escape into. See [Types and null safety](./types).
- **Mutability you can see.** `val name` never changes; `var $name` does, and
  keeps its `$` everywhere it is used. See [Values and variables](./bindings).
- **Better building blocks.** Records (typed arrays), data classes, sealed
  hierarchies with exhaustive `when`, generics with variance, lambdas and
  extension functions.
- **Tooling.** `sphp check`, `sphp build`, `sphp build --watch`, and a language
  server for your editor.

## What it keeps

StirPHP is PHP underneath. `->` accesses members, `.` concatenates, namespaces,
`use`, `new`, `try`/`catch` and PHP's functions all work as usual. Plain `.php`
files can live next to `.sphp` ones, and their PHPDoc is read the way PHPStan
reads it, so a project can move over one file at a time. See
[Working with PHP](./php-interop).

## Status

StirPHP is young. The language, checker, compiler and language server work end
to end (Parsedown has been ported to it, with its test suite passing), but
there are no prebuilt releases yet and the language may still change.

Next: [Installation](./installation).
