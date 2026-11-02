# The generated PHP

`sphp build` aims for PHP you would be happy to read and debug. Every file
starts with `declare(strict_types=1);` (unless
[`strictTypes`](./configuration) is off), keeps its namespace, `use`s, doc
comments and attributes, and gets PHPDoc that PHPStan understands where native
types can't say enough.

| StirPHP | PHP |
|---|---|
| `val x = 1`, `var $x = 1` | `$x = 1` |
| `"${a} and ${b}"` | `"{$a} and {$b}"` |
| `x?->name`, `x ?: y` | `$x?->name`, `$x ?? $y` |
| `x!!` | `$x ?? throw new \TypeError(...)` |
| `a == b` (StirPHP types) | `$a === $b` |
| `a / b` | `$a / $b` |
| `a->div(b)` | `\Stir\Int_div($a, $b)` |
| `when` (as a value) | `match` |
| `x is Point` | `$x instanceof Point`, or `\is_array(...)` checks for records |
| `{ x: Int -> x * 2 }` | `fn (int $x): int => $x * 2` |
| `record Point { ... }` | an array; `array{x: int, y: int}` in PHPDoc |
| `data class` | `final readonly class` with promoted properties |
| `class` (not `open`) | `final class` |
| `listOf(1, 2)`, `mapOf("a" to 1)` | `[1, 2]`, `['a' => 1]` |
| `T?`, generics, function types | native types plus `@param`/`@return`/`@template` |
| `unknown` | `mixed` |
| `resource` | no native type; `@param resource` in PHPDoc |

## Extension functions and the runtime

`function String.shout()` in namespace `App` becomes the function
`\App\String_shout($this)`, and `"a"->shout()` a call to it. The standard
library is emitted the same way into `stir-runtime.php` in the output
directory, in the `Stir` namespace; generated files that use it
`require_once` it.

With `--inline-extensions`, calls to expression-bodied extension functions
are replaced by their bodies:

```sphp
val s = "hi"->uppercase()
```

```php
// without inlining
$s = \Stir\String_uppercase('hi');
// with --inline-extensions
$s = \mb_strtoupper('hi');
```

## Source maps

Next to every `.php` file, `sphp build` writes a `.php.map`
([source map v3](https://sourcemaps.info/spec.html)) pointing back at the
`.sphp` source. Pass `--no-source-maps` to skip them.
