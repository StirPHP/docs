# Types and null safety

## StirPHP types and PHP types

StirPHP has its own types, separate from PHP's:

| StirPHP | At runtime | PHP counterpart |
|---|---|---|
| `Int` | `int` | `int` |
| `Float` | `float` | `float` |
| `String` | `string` | `string` |
| `Bool` | `bool` | `bool` |
| `Unit` | `void` | `void` |
| `Nothing` | `never` | `never` |
| `List<T>`, `MutableList<T>` | `list` | `array` |
| `Map<K, V>`, `MutableMap<K, V>` | `array` | `array` |
| `(A, B) -> R` | `Closure` | `callable` |

The difference is in the rules, not the representation. StirPHP types never
coerce: an `Int` is never silently a `String`, and `"10"` is never a number.
They also have methods (see [Extensions and the stdlib](./extensions)).

PHP's own types (`int`, `string`, `array`, ...) are still there, for code that
talks to PHP. A StirPHP value can always be passed where a PHP type is
expected; the other way round needs a check, because a PHP `int` may have
come from anywhere:

```sphp
val a: int = 42                // Int → int: fine
val n: Int = strlen("abc")     // PHP's native return types are trusted

function legacy(id: int): int = id
val c: Int = legacy(1) // error: SPHP0005
```

PHP functions with native return types (like `strlen`'s `int`) are seen with
the matching StirPHP type, because PHP enforces them. A PHP type written in
StirPHP code stays a PHP type.

Arithmetic follows PHP: `/` gives a float unless it divides evenly, and `.`
concatenates strings and numbers, but not a `Bool` or null:

```sphp
val half = 7 / 2          // 3.5
val label = "n=" . half   // "n=3.5"
val same = "n=${half}"
val flag = "on: " . true // error: SPHP0015
```

## Comparisons

Comparing values that can never be equal is an error, not `false`:

```sphp
val n = 3
if (n == "3") { // error: SPHP0013
    echo "never"
}
```

`==` between StirPHP types compares strictly (it compiles to `===`).

## Null safety

`null` is not a value of every type. `String?` is "a `String` or null", and a
`String?` can't be used where a `String` is needed until you have checked it:

```sphp
function shout(s: String): String = s->uppercase()

function greet(name: String?): String {
    return shout(name) // error: SPHP0005
}
```

The tools for dealing with null:

```sphp
function label(name: String?): String {
    // `?->` stops at null
    val upper: String? = name?->uppercase()

    // `?:` supplies a default for null
    val shown: String = upper ?: "anonymous"

    // a null check narrows the type ("smart cast")
    if (name != null) {
        return "${name->substring(0, 1)}: ${shown}"
    }
    return shown
}

// `!!` asserts "not null", and throws a TypeError if it is
function required(name: String?): String = name!!
```

Accessing a member of a nullable value without one of these is an error, and
`?->` on a value that can't be null gets a warning:

```sphp
val maybe: String? = null
echo maybe->length() // error: SPHP0012
val sure = "text"
echo sure?->length() // warning: SPHP0021
```

## No top type

There is no `mixed`, no `Any`, no `object`-as-anything in StirPHP code.
Accepting "any value" is what generics are for (see [Generics](./generics)):

```sphp
function <T> first(items: List<T>): T? = items->firstOrNull()

function bad(x: mixed): Unit {} // error: SPHP0003
```

## Untyped PHP values: `Any!`

A value from PHP code without type information has the type `Any!`: "unknown,
check before use". You can hold it in a local and pass it back to PHP, but to
do anything else you narrow it with `is` (or cast it with `as`):

```sphp
function count_items(json: String): Int {
    val data = json_decode(json, true)      // Any!
    if (data is List<Int>) {
        return data->size()
    }
    return 0
}
```

An `Any!` can't escape into your types: it can't be returned from a function
without a declared return type, or stored in a property.

Types that PHP code declares only in PHPDoc are *platform types*, written
`T!`: they are probably `T`, but nothing enforces it at runtime. See
[Working with PHP](./php-interop).

## Unions and literal types

Unions are written with `|`, and string, int and bool literals are types of
their own. A union of literals is a closed set of values:

```sphp
typealias Level = "debug" | "info" | "error"

function prefix(level: Level): String = when (level) {
    "debug" -> "[d]"
    "info" -> "[i]"
    "error" -> "[E]"
}

echo prefix("info")
echo prefix("warn") // error: SPHP0005
```

`typealias` names any type. A union is never widened to `mixed`.
