# Classes and data classes

## Classes

A class can declare its constructor parameters right after its name: the
*primary constructor*. Parameters marked `val` or `var` become properties.

```sphp
class User(val id: Int, var $name: String) {
    function rename(to: String): Unit {
        $name = to
    }

    function label(): String = "${name} (#${id})"
}

val u = new User(1, "Ada")
u->rename("Ada L.")
echo u->label()
```

Objects are created with `new`, as in PHP.

### Properties

Properties follow the [binding rules](./bindings): `val` properties can't be
assigned after construction, `var $name` properties can. Inside the class they
are available without `$this->`, and the sigil still tells them apart:

```sphp
class Counter {
    var $count: Int = 0
    val step: Int = 2

    function tick(): Unit {
        $count += step          // $this->count += $this->step
    }

    function reset(): Unit {
        step = 1 // error: SPHP0010
    }
}
```

When a parameter has the same name as a property, `name` is the parameter and
`$name` the mutable property: `$name = name` assigns one to the other.

Visibility is `public` by default; `private` and `protected` work as in PHP.
Static members use `static` and are reached with `ClassName::member`.

### Methods

Methods can be called without `$this->` too, if the arguments fit. If they
don't, a bare call means PHP's global function of that name, which is how a
`count()` method can use PHP's `count`. `$this->name()` always means the method:

```sphp
class Cart {
    private var $items: array<string> = []

    function count(): int = count($items)
    function isEmpty(): bool = $this->count() === 0
}
```

## Final by default

Classes and their methods are final unless marked `open` (or `abstract`). An
overriding method is marked `override`:

```sphp
open class Shape(val name: String) {
    open function area(): Float = 0.0
    function describe(): String = "${name}: ${area()}"
}

class Circle(val r: Float) : Shape("circle") {
    override function area(): Float = 3.14159 * r * r
}

class Square : Shape("square") {
    override function size(): Int = 1 // error: SPHP0031
}
```

The superclass and interfaces come after a colon; a superclass is followed by
its constructor arguments. `abstract` classes and `interface`s work as in PHP.

In the generated PHP, a class that isn't `open` is `final`, and so are its
methods. What a subclass can override carries its type in PHPDoc only, so plain
PHP subclasses can override it without type declarations: the return types of
`open`, abstract and interface methods, and the types of `var` properties that
subclasses can see.

## Data classes

A `data class` is an immutable value object. All its properties are `val`, and
it compiles to a `final readonly` PHP class:

```sphp
data class Money(val cents: Int, val currency: String)

val price = new Money(1999, "EUR")
echo price->cents
```

## Sealed hierarchies

A `sealed` class or interface lists its subclasses implicitly: only classes
in the same project may extend it, so `when` can check that every case is
handled. See [when, is and smart casts](./control-flow#exhaustiveness).

```sphp
sealed interface Shape
data class Circle(val r: Float) : Shape
data class Rect(val w: Float, val h: Float) : Shape

function area(s: Shape): Float = when (s) {
    is Circle -> 3.14159 * s->r * s->r
    is Rect -> s->w * s->h
}
```

## Enums

Enums are PHP's enums:

```sphp
enum Suit: string {
    case Hearts = "H"
    case Spades = "S"
}

echo Suit::Hearts->value
```
