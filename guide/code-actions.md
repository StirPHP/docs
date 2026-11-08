# Code actions

The language server offers quick fixes on diagnostics, and refactorings where the cursor is or on a selection. Every edit
is checked to leave each file it touches parsing, or it isn't made. Nothing is offered in a file that has syntax errors.

You can try them in [the editor on this site](/editor): open the `basics` sample, put the cursor on an error, and press
`Ctrl+.` (`Cmd+.` on a Mac).

## Quick fixes

Offered on a diagnostic, and marked as preferred where one of them is clearly the fix:

- **Unknown names:** a class, function or constant that isn't known can be imported, one action for each that has that
  name in the workspace, nearest namespace first, with the `use` line put where completion puts it. Names that look like a
  typo get **Change to ...**, for classes, functions, constants, methods (only those that could take the arguments),
  properties and variables, but not for members of a class whose `__call` or `__get` takes any name.
- **Imports:** an import nothing uses is greyed out in the editor (as a hint, `SPHP0080`, which `stirphp check` doesn't
  report) and can be removed, alone or with all the others. **Organize imports** (`source.organizeImports`) removes them and
  sorts what's left as completion's insertion does: classes, then functions, then constants, with a blank line between. A
  comment stays with the line it's on or above, and lists and groups (`use A\{B, C}`) keep their form. An import counts as
  used if its name appears in the code in any way, or in a doc comment or a comment with a tag, so one may be kept that
  isn't used, but never the other way round.
- **Types left out:** a return type from what every `return` gives, when every path ends in one (or `void`, for none), a
  parameter's type from its PHPDoc or from what it overrides, and a property's from its PHPDoc or, for a private one, from
  everything assigned to it in its class. Only what the file's PHP version can say natively, and nothing a subclass or what's
  overridden would stop compiling over. What PHPDoc can say better, such as `list<string>`, goes in a doc comment, and so
  does a type only PHPDoc can say. These are also refactorings with the cursor on the name, for levels below 6.
- **What a class has to have:** a class that doesn't implement the abstract or interface methods it has to is reported
  (`SPHP0062`, as PHP won't load it), and the fix writes them all, with the signatures and visibility they need, the imports
  for their types, and a body that throws a `LogicException` saying it's not implemented. A call of a method or property of
  the class itself that doesn't exist (`$this->foo()`, `self::bar()`) can create it, private, with parameters typed from the
  arguments where that's known.
- **Nullable types:** `T $x = null` (`parameter.implicitlyNullable`) as `?T`, `return null;` in something that doesn't
  allow it, and a property whose default is `null`.
- **Other:** `return null;` at the end of a function missing a return, if its type allows it; removing code that can't be
  reached, unless something in it is declared or is a `goto` label; removing a variable that's assigned something without
  effects and never read.
- **Ignoring:** `// @phpstan-ignore <identifier>` on the line, added to one that's there, or on the line above when the
  line is in a heredoc or HTML. It's offered for every identifier that can be ignored, StirPHP's own codes too.
- **PHPStan's errors** get the same fixes where their identifier is one of these and their line can only be about one
  thing, as they have nothing more precise than a line; and **Ignore** always.
- **`source.fixAll`**, when an editor asks for it, as on save: removes unused imports and makes implicitly nullable
  parameters nullable, which can't change what the code does.

## Refactorings

With the cursor on something, or a selection:

- **Extract to a variable**, and the same value again in the statement if nothing in it can change it; **inline a
  variable** assigned once (anything if what it's assigned is constant, otherwise only into the next statement, first
  thing). Both refuse what would run something in another order, or less often, and say why.
- **Extract method** (or function, outside classes) on whole statements or an expression. See below.
- **Change signature:** remove a parameter nothing uses, move one left or right, add one, for a function or a method and
  everything it overrides or is overridden by, updating every call.
- **Classes:** generate a constructor from the properties without a value, promote properties to the constructor and
  back, getters and setters, override a parent's method, and add `#[\Override]` on PHP 8.3.
- **Flow:** flip `if` and `else`, turn an `if` at the end of a function or loop into an early `return` or `continue`, drop
  the `else` of an `if` that always leaves, and `switch` to `match` where that means the same.
- **Import a name** written in full, wherever it's written so in the namespace.

A refused action is shown greyed out with the reason, in an editor that can show that.

### Extract method

It works out what the selection reads and writes in the order things run. What it reads before it's certainly written,
and that's certainly set before, becomes a parameter; what it writes that's read afterwards (or before, around a loop) is
returned, as an array that's destructured for more than one. A parameter gets a type only if that's certain where the
selection starts. The method is private, and static if it doesn't need `$this`, and its name is one the class and every
class related to it don't have. `return` is taken if every path through the selection returns, and then the call is
returned.

It refuses `break` and `continue` out of the selection, `yield`, `goto`, `global` and `static` variables, references
(`&`) to what it uses, `compact`, `extract`, `$$x`, `eval` and other ways of reaching variables by name, `__FUNCTION__`
and `__LINE__`, a selection in a closure, and a variable that might not be set, or that carries over from one time round a
loop to the next.

In an editor that implements `stirphp.renameAt` (VS Code, and the editor on this site), the new name is selected for
renaming straight after; elsewhere it's `extracted`.

### Change signature

The protocol has no dialog, so each change is its own action. All calls are found through what the checker resolved,
across the project, including `parent::`, `new`, `new static`, attributes and a subclass's `new` that uses the parent's
constructor. If any can't be updated, nothing is changed and you're told where: a spread argument that covers the
parameters concerned, an argument with effects that removing it would drop, a call where both arguments being swapped have
effects, a first-class callable (`foo(...)`), a callable string or `[$x, 'foo']` given to PHP's functions, and a call of a
method of that name whose receiver's class isn't known. `$x->$name()` can't be seen at all. Named arguments are updated by
name.

A new parameter with a default leaves the calls alone. Without one it's put before any optional parameters, and calls pass
`TODO_NEW_ARGUMENT`, a constant that doesn't exist, so each call is an error until it's given a real value, rather than
quietly running with a wrong one. An editor that implements `stirphp.askParameter` asks for the parameter
(`int $limit = 10`) and what calls should pass; others add `$newParameter`.

## Edits

Edits use `documentChanges` with the version of each open file when the editor can take that, and keep the file's line
endings and indentation. Rename, change signature and the other actions that reach across files edit files that aren't
open too.

## Not offered

Adding `declare(strict_types=1)`, which isn't reported and changes what the code does; moving a class to the file PSR-4
says, which would mean creating and renaming files; adding to a baseline; extracting from a closure; and inlining methods.

## How well it works

Measured on Laravel's framework, Symfony and PHPStan's source, at diagnostics and a fixed sample of places and selections
in 400 files of each: about 5,000 actions applied, every result parsed, and about 25 left a new error in the file, which
were all the checker seeing the moved code differently rather than the code doing something else. Working out what's
offered took 0.1 ms at the median and 15 ms at the 95th percentile, and extracting a method 3 to 6 ms.
