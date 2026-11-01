# Extensions and the stdlib

## Extension functions

An extension function adds a method to an existing type, including the
built-in ones. The receiver type goes before the name, and `this` is the
receiver:

```sphp
function String.shout(): String = this->uppercase() . "!"

function List<Int>.mean(): Float =
    if (this->isEmpty()) 0.0 else this->sum()->toFloat() / this->size()->toFloat()

echo "hello"->shout()
```

Extension functions are resolved statically, from the declared type of the
receiver. They compile to plain functions named after their receiver
(`String_shout`), in the declaring namespace.

### Inlinable by construction

`sphp build --inline-extensions` replaces calls to expression-bodied extension
functions with their bodies, so `"a"->shout()` becomes
`\mb_strtoupper('a') . '!'`, with no call at all. To make that always
possible, an extension function may only use its parameters (including
`this`) and global names, never private members, and may not be recursive:

```sphp
class Account(private val secret: String)

function Account.leak(): String = this->secret // error: SPHP0024

function Int.factorial(): Int = if (this <= 1) 1 else this * (this - 1)->factorial() // error: SPHP0029
```

## The standard library

The methods of StirPHP's built-in types are extension functions written in
StirPHP, in the `Stir` namespace. Since StirPHP types are plain PHP values at
runtime, each one is a typed facade over PHP builtins. The stdlib is always
available, without `use`:

```sphp
val words = "the quick brown fox"->split(" ")
val long = words->filter { it->length() > 3 }->map { it->uppercase() }
val counts = words->groupBy { it->length() }->mapValues { it->size() }
echo long->joinToString(", ")
```

| Type | Highlights |
|---|---|
| `String` | `length`, `uppercase`, `lowercase`, `trim`, `split`, `lines`, `substring`, `startsWith`, `contains`, `replace`, `matches`, `padStart`, `toIntOrNull`, ... (lengths and indices count Unicode code points) |
| `Int`, `Float` | `abs`, `coerceIn`, `pow`, `isEven`, `until`, `downTo`, `toFloat`, `roundToInt`, ... |
| `List<T>` | `map`, `filter`, `fold`, `groupBy`, `associateBy`, `sortedBy`, `firstOrNull`, `sumOf`, `chunked`, `zip`, `joinToString`, ... |
| `MutableList<T>` | `add`, `addAll`, `removeAt`, `removeLast`, `sort`, `clear`, ... (modify in place) |
| `Map<K, V>` | `keys`, `values`, `getOrElse`, `filterKeys`, `mapValues`, `toList`, ... |
| `MutableMap<K, V>` | `put`, `getOrPut`, `remove`, `putAll`, `clear`, ... |
| any `T` | `let`, `also`, `takeIf`, `takeUnless` |
| top level | `listOf`, `mutableListOf`, `mapOf`, `mutableMapOf`, `emptyList`, `requireThat`, `check`, `error`, `TODO`, ... |

The read-only operations on `List` and `Map` also apply to their mutable
variants. Methods that modify a `MutableList` or `MutableMap` need a receiver
that can change: a `var`, a `mut` parameter or a mutable property:

```sphp
var $seen = mutableListOf<String>()
$seen->add("a")

val frozen = mutableListOf<String>()
frozen->add("b") // error: SPHP0010
```

The full source is in [`stdlib/`](https://github.com/StirPHP/core/tree/main/stdlib).
