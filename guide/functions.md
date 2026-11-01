# Functions and lambdas

## Functions

Parameters and the return type are written after a colon. A function whose
body is a single expression can use `=`:

```sphp
function area(width: Int, height: Int): Int {
    return width * height
}

function square(side: Int): Int = area(side, side)

function greet(name: String, greeting: String = "Hello"): String = "${greeting}, ${name}!"

echo greet("Ada")
echo greet("Ada", "Welcome")
```

A block-bodied function with a return type must return on every path:

```sphp
function sign(n: Int): String { // error: SPHP0022
    if (n > 0) {
        return "+"
    }
}
```

A function without a declared return type returns `Unit` (PHP's `void`),
except an expression-bodied one, whose return type is inferred.

Parameters are immutable unless marked `mut`; see
[Values and variables](./bindings#parameters). A trailing `...rest: T`
parameter collects any number of arguments into a `List<T>`.

## Function types and lambdas

A function type is written `(A, B) -> R`. A lambda is written in braces, with
its parameters before `->`:

```sphp
val add: (Int, Int) -> Int = { a, b -> a + b }
val twice = { f: (Int) -> Int, x: Int -> f(f(x)) }

echo add(2, 3)
echo twice({ n -> n * 10 }, 1)
```

A lambda with one parameter can leave it unnamed and use `it`:

```sphp
val inc: (Int) -> Int = { it + 1 }
echo inc(41)
```

When the last argument of a call is a lambda, it can follow the parentheses,
and empty parentheses can be dropped:

```sphp
val names = listOf("ada", "grace", "edsger")
val shown = names
    ->filter { it->length() > 3 }
    ->map { it->uppercase() }
    ->joinToString(", ")
```

Lambdas capture the values and variables around them. A lambda can modify a
captured `var`:

```sphp
var $total = 0
listOf(1, 2, 3)->forEach { $total += it }
echo $total
```

PHP's own `function () use (...) {}` closures and `fn () =>` arrow functions
also work, with the PHP semantics.

## Infix calls

A method or extension function taking one argument can be called without
`->` and parentheses. It's used for things that read better that way:

```sphp
val pair = "port" to 8080
val range = 1 until 5
```

`a name b` means exactly `a->name(b)`.
