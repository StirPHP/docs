# Generics

Since StirPHP has no top type, generics are how code accepts values of any
type. Type parameters come before the function name:

```sphp
function <T> firstOr(items: List<T>, fallback: T): T = items->firstOrNull() ?: fallback

val n = firstOr(listOf(3, 4), 0)          // T = Int
val s = firstOr(listOf<String>(), "none") // T = String
```

Type arguments are usually inferred, from the arguments and from the type the
result is expected to have. They can also be given explicitly, as in
`listOf<String>()`.

## Bounds

`T of Bound` restricts a type parameter. Members of the bound are then
available on `T`:

```sphp
interface HasArea {
    function area(): Float
}

data class Sq(val side: Float) : HasArea {
    function area(): Float = side * side
}

function <T of HasArea> largest(a: T, b: T): T = if (a->area() >= b->area()) a else b

echo largest(new Sq(2.0), new Sq(3.0))->side
echo largest(1, 2) // error: SPHP0028
```

## Generic classes

```sphp
class Stack<T> {
    private var $items: MutableList<T> = mutableListOf()

    function push(item: T): Unit {
        $items->add(item)
    }

    function pop(): T? = $items->removeLastOrNull()
}

val s: Stack<Int> = new Stack()
s->push(1)
```

## Variance

A type parameter of an interface or class can be declared `out` (only
produced) or `in` (only consumed). The checker verifies the declaration, and
in return `Source<Int>` is a `Source<Int | String>`:

```sphp
interface Source<out T> {
    function next(): T
}

interface Sink<in T> {
    function put(item: T): Unit
}

interface Broken<out T> {
    function put(item: T): Unit // error: SPHP0027
}
```

The built-in collections follow the same rules: `List<T>` is covariant
(read-only), `MutableList<T>` is invariant.

## In the generated PHP

Type parameters become `@template` tags (`@template-covariant` for `out`,
with `of` bounds), so PHPStan sees the same generics.
