# Diagnostics

Every diagnostic has a stable code. In `.php` files, diagnostics are filtered
by the PHPStan level of the project (see [Configuration](./configuration#phpstan-neon));
in `.sphp` files they are always reported.

| Code | Name | Raised when |
|---|---|---|
| `SPHP0001` | syntax | The file doesn't parse. Other diagnostics of the file are held back until it does. |
| `SPHP0002` | unknown type | A type name doesn't resolve. |
| `SPHP0003` | top type | `mixed`, `Any` or another top type is written in StirPHP code. |
| `SPHP0004` | missing type | A declaration needs a type and has neither a type nor an initializer. |
| `SPHP0005` | type mismatch | A value isn't assignable where it is used (assignment, argument, return, `when` exhaustiveness, ...). |
| `SPHP0006` | undefined variable | A name doesn't resolve to a binding, constant or property. |
| `SPHP0007` | undefined function | A called function doesn't exist. |
| `SPHP0008` | undefined class | A class, interface, enum or record doesn't exist. |
| `SPHP0009` | undefined member | A property, method, constant or field doesn't exist on the type. |
| `SPHP0010` | reassign immutable | A `val`, parameter, read-only property or read-only collection is modified. |
| `SPHP0011` | val/var clash | A `val x` and a `var $x` share a name in one scope. |
| `SPHP0012` | nullable access | A member of a nullable value is used without `?->`, `!!` or a null check. |
| `SPHP0013` | incompatible comparison | Two values that can never be equal are compared. |
| `SPHP0014` | argument count | Too many or too few arguments, or an unknown named argument. |
| `SPHP0015` | invalid operand | An operator is applied to a type it doesn't support (`.` on a `Bool`, member access on `Any!`, ...). |
| `SPHP0016` | sigil mismatch | A `val` is written with `$`, or a `var` without it. |
| `SPHP0017` | undeclared assignment | A variable is assigned without a `var` declaration. |
| `SPHP0018` | not callable | A value that isn't a function is called. |
| `SPHP0019` | untyped escape | An `Any!` would be returned or stored in a property. |
| `SPHP0020` | generic arity | A generic type is given the wrong number of type arguments. |
| `SPHP0021` | unnecessary null check | `?->` or `?:` on a value that can't be null (a warning). |
| `SPHP0022` | return value | A function with a return type can end without returning. |
| `SPHP0023` | instantiation | `new` on an interface, abstract or sealed class, enum or record. |
| `SPHP0024` | visibility | A private or protected member is used from outside. |
| `SPHP0025` | duplicate declaration | A name is declared twice in one scope. |
| `SPHP0026` | unsupported syntax | PHP syntax that StirPHP doesn't allow in `.sphp` files. |
| `SPHP0027` | variance | An `in`/`out` type parameter is used in the wrong position. |
| `SPHP0028` | type bound | A type argument doesn't satisfy its parameter's `of` bound. |
| `SPHP0029` | not inlinable | An extension function uses something it can't (private members, recursion, local state of the caller). |
| `SPHP0030` | missing implementation | A class doesn't implement an abstract member. |
| `SPHP0031` | incompatible override | An override doesn't match what it overrides, or overrides something final. |
| `SPHP0032` | data class | A data class breaks its rules (for example a mutable property). |
| `SPHP0050` | PHPDoc mismatch | A PHPDoc type contradicts the native type it annotates (`.php` files). |

## Machine-readable output

`sphp check --format json` prints the diagnostics as a JSON array; see
[Command line](./cli#sphp-check).
