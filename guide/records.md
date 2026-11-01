# Records

A `record` is a typed, structural array: a C-like struct. At runtime it is a
plain PHP array with string keys, so records are cheap, serialize naturally,
and cross into PHP code as the arrays it expects.

```sphp
record Point {
    x: Int
    y: Int
}

var $p = Point { x = 1, y = 2 }
$p->x = 10
echo $p->x + $p->y
```

Fields are read and written with `->`. A field may have a default, and a
record literal must give every field without one:

```sphp
record Line {
    name: String
    cents: Int
    qty: Int = 1
}

val coffee = Line { name = "coffee", cents = 350 }
val beans = Line { name = "beans", qty = 2 } // error: SPHP0014
```

## Values, not objects

Records have value semantics: assigning one copies it. Changing a copy never
changes the original:

```sphp
record Point { x: Int; y: Int }

var $a = Point { x = 1, y = 1 }
var $b = $a
$b->x = 99
echo $a->x            // 1
```

Records are always mutable through a `var`. For an immutable value, use a
[data class](./classes#data-classes).

## Structural compatibility

Records are compared by layout, not by name. A record whose fields start with
the same fields (in the same order and with compatible types) as another is
assignable to it, like a C struct with a common prefix:

```sphp
record Named { name: String }
record Person { name: String; age: Int }

function hello(n: Named): String = "hello ${n->name}"

echo hello(Person { name = "Ada", age = 36 })
```

The extra fields are still there at runtime. To use them again, cast with
`as`, which checks the keys at runtime.

## Recursive records

A record can contain itself, for trees:

```sphp
record Tree {
    label: String
    children: List<Tree> = listOf()
}

function size(t: Tree): Int = 1 + t->children->sumOf { size(it) }
```

## Generic records

```sphp
record Box<T> { value: T }

val b = Box { value = 42 }
echo b->value
```

The standard library's `Pair<A, B>` (made by `a to b`) is a generic record.
