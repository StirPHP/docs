# Values and variables

StirPHP has two kinds of local bindings, and you can tell them apart wherever
they are used.

```sphp
val limit = 10          // a value: never reassigned, written without `$`
var $count = 0          // a variable: reassignable, always written with `$`

$count += 1
$count = $count + limit
```

The `$` is not decoration: it says "this can change". Reading `limit` tells
you the value is the one it was declared with; reading `$count` tells you to
look for assignments.

## Rules

A `val` can't be reassigned:

```sphp
val limit = 10
limit = 20 // error: SPHP0010
```

A value and a variable can't share a name, so `x` and `$x` never refer to
different things in the same scope:

```sphp
val total = 1
var $total = 2 // error: SPHP0011
```

Using the wrong sigil is an error, which keeps the convention honest:

```sphp
val name = "Ada"
var $age = 36
echo $name // error: SPHP0016
echo age // error: SPHP0016
```

Variables must be declared before they are assigned. PHP's implicit
declaration by assignment is a classic source of typos:

```sphp
var $total = 0
$totl = 5 // error: SPHP0017
```

A `for` loop declares its counter the same way:

```sphp
var $sum = 0
for (var $i = 0; $i < 3; $i++) {
    $sum += $i
}
```

## Types

A binding's type is inferred from its initializer, or written after a colon:

```sphp
val port = 8080
val host: String = "localhost"
var $retries: Int = 3
var $lastError: String? = null
```

A `var` declared without an initializer needs a type. A `val` keeps the exact
type of its value (`val port = 8080` has the type `8080`, which is an `Int`), so
it can be used where a literal type is expected; see
[literal types](./types#literal-types).

## Parameters

Function parameters are values: they can't be reassigned unless marked `mut`.
A `mut` parameter is still written without `$`:

```sphp
function countdown(mut n: Int): String {
    var $out = ""
    while (n > 0) {
        $out .= "${n} "
        n -= 1
    }
    return $out
}
```

## Properties

The same rule applies to class properties: `val` properties are read-only,
`var $name` properties are mutable. Inside a class, both are available without
`$this->`, and the sigil still says which is which. See
[Classes](./classes#properties).

## Constants

Global and class constants work as in PHP. A local `val` may shadow a global
constant of the same name.

```sphp
const VERSION = "1.0"

function banner(): String {
    val VERSION = "dev"
    return "app ${VERSION}"
}
```
