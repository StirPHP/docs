# when, is and smart casts

## if as an expression

`if` can produce a value:

```sphp
function parity(n: Int): String = if (n % 2 == 0) "even" else "odd"
```

## when

`when` picks the first matching branch. With a subject, branches compare
against it; `is` tests a type, and `else` catches the rest:

```sphp
function describe(x: Int | String | null): String = when (x) {
    null -> "nothing"
    is Int -> "the number ${x}"
    is String -> "the text '${x}'"
}

function grade(score: Int): String = when {
    score >= 90 -> "A"
    score >= 75 -> "B"
    else -> "C"
}
```

A `when` used as a value compiles to PHP's `match`.

## Exhaustiveness

A `when` without `else` must handle every possible value of its subject. That
is checked for sealed hierarchies, enums, literal unions, `Bool` and nullable
types:

```sphp
sealed interface Result
data class Ok(val value: Int) : Result
data class Failed(val reason: String) : Result

function show(r: Result): String = when (r) { // error: SPHP0005
    is Ok -> "ok ${r->value}"
}
```

Add the missing `is Failed` branch and it compiles. When a new subclass of
`Result` is added later, every `when` that forgot it becomes an error.

## is and smart casts

`x is T` tests a type at runtime. After a successful test, `x` has the type
`T`: a *smart cast*. Null checks, `is`, early returns and `when` branches all
narrow:

```sphp
function len(x: String | List<Int> | null): Int {
    if (x == null) {
        return 0
    }
    if (x is String) {
        return x->length()        // x: String
    }
    return x->size()              // x: List<Int>
}
```

Assigning to a `var` resets what was learned about it.

## as

`x as T` converts the static type, checking at runtime that the value is a
`T` (a `TypeError` otherwise). `as?` gives `null` instead of throwing.

```sphp
function port(raw: String): Int {
    val decoded = json_decode(raw)       // Any!
    return decoded as Int
}
```

Generic type arguments are not checked at runtime: `as List<Int>` checks that
the value is a list, not what is in it.
