# Rules and hooks

A project's own checks, and what the checker can't know from its code, are scripts in [Rhai](https://rhai.rs), a small
scripting language, listed in the configuration. Paths are relative to the file that lists them:

<<< @/examples/rules/stirphp.neon{neon}

The script API can still change before StirPHP is stable.

## Rules

A rule is a function named after the kind of node it wants to see, `visit_<kind>`, and only those nodes are visited:

<<< @/examples/rules/rules/no_var_dump.rhai{rhai}

Reports go the way of any other diagnostic, under the identifier you give, so `@phpstan-ignore app.noVarDump`,
`ignoreErrors` and baselines all apply. An identifier has a dot in it, as PHPStan's do, such as `app.noVarDump`.

- `ctx.error(message, identifier)` reports an error, and `ctx.warning(message, identifier)` a warning.
- A report counts at every level unless it says otherwise, as in `ctx.error(message, identifier, #{ level: 6 })`.
- `#{ node: other }` reports somewhere else than the node visited.

### Kinds of node

<!--@include: ./parts/node-kinds.md-->

A wrong one is an error that lists them all. A node that's only part of what's around it isn't visited on its own: the
`foo` of `foo()` isn't a `const_fetch`, and `$a->b` in `$a->b()` isn't a `property_fetch`.

### Nodes

| | |
|---|---|
| `node.kind` | one of the kinds above |
| `node.name` | what it names, as written: a function called, a method, a class; no `$` on a variable, no leading `\` |
| `node.text` | its source text |
| `node.range` | `start` and `end` (offsets), `line` and `column` (from 1) |
| `node.arguments` | the expressions passed to a call, in order |
| `node.children` | the nearest nodes below it that scripts see |
| `node.receiver` | what a member is looked up on: `$a` of `$a->b()`, `Foo` of `Foo::bar()` |

### Types

`ctx.get_type(node)` gives the type the checker found for an expression. Rhai reserves `type_of` and `call`, so that's
`get_type`, and a parameter can't be named `call`; a map's keys can't be `static` either.

| | |
|---|---|
| `to_string()` | as PHPDoc writes it |
| `is_null()`, `is_nullable()`, `is_unknown()` | |
| `is_string()`, `is_int()`, `is_float()`, `is_bool()`, `is_array()`, `is_object()` | |
| `is_subtype_of("Foo")` | |
| `without_null()` | |
| `class_name` | the class of an object type |
| `class_string` | the class a `class-string` names, as in `Foo::class` |
| `literal` | the value of a literal type |
| `members()`, `has_method("x")`, `has_property("x")` | |
| `type_args`, `types()` | its type arguments; a union's members |
| `method_type("x")` | what a method of it returns |
| `callable_params()` | `#{ required, max }` of a callable, `max` being `-1` for any number |

`ctx.file` is the path of the file being checked.

## Return type hooks

A hook tells the checker what it can't know from the code. These are PHPStan's dynamic return type extensions: they
answer with a PHPDoc type as a string, such as `"list<App\\User>"`. Names in it are complete, as no file's `use` applies.

<<< @/examples/rules/rules/container_return_type.rhai{rhai}

`return_type_targets()` can also list `static_methods` and `functions`, for `return_type_of_static_method` and
`return_type_of_function`. `ctx.get_type` knows the receiver and the arguments of the call, and `ctx.declared_return_type`
is what the signature says.

## Magic members

PHPStan's class reflection extensions: lookups, hover and completion see these members on a class and its subclasses, as
if `@property` and `@method` tags said so. Anything PHP itself declares comes first.

<<< @/examples/rules/rules/model_magic_members.rhai{rhai}

A property's value is a type or `#{ type, read_only, write, declared_at }`, a method's a return type or
`#{ returns, params, is_static, declared_at }`. `write` is what a property takes when it's set, if that's not its type, and
`declared_at` (`"App\\Post::author"`, or `"App\\Post::$title"` for a property) is where going to the definition leads.

Besides `properties` and `methods`, the answer can say `forward_calls: "App\\Query<static>"`: calls of methods the class
hasn't got, on an object or statically, are made on a value of that type instead, and give what they give there, as with
a model forwarding to its query builder. `static` in it is the class the call is made on. Completion offers that type's
public methods too.

What depends on a type's arguments, or on the name itself, is answered one name at a time. These run only where nothing
else has the member, `@mixin` types included, just before `__call` and `__get` would be reported:

<<< @/examples/rules/rules/query_where.rhai{rhai}

`magic_method` answers like a method in `magic_members`, and `magic_property` like a property, or either with
`#{ forward_to, fluent }`: the member of that name on that type. With `fluent: true`, a call that gives back the value it
was forwarded to gives back the original one, as a relation does with its query. `global_type(name)` gives the type of a
global variable, for `global $name;`.

## All of them at work

With the four scripts above, on this code:

<<< @/examples/rules/src/app.php{php}

<<< @/examples/rules/output/check.console{text}

`$container->get(Mailer::class)` is a `Mailer`, so the misspelt `sned` is found. `User::find(1)` and `$user?->id` come from
`magic_members`, and `$query->whereEmail(..)` from `magic_method`; `$user?->name` is declared by none of them. And
`var_dump` is reported under the rule's identifier.

## Reading the project

Scripts see the project's classes with `class("App\\Post")`, which is `()` for one that isn't there.

- A **class** has `name`, `kind`, `parent`, `type`, `type_params`, `is_abstract`, `is_subtype_of("..")` (traits count),
  `ancestors()`, `methods()`, `method("..")`, `properties()`, `property("..")`, `constant("..")` and `attributes()`, as
  `#{ name, args }` with arguments by position (`"0"`) and by name.
- A **method** has `name`, `class`, `is_static`, `is_magic`, `visibility`, `return_type`, `params`, `params_text(skip)` (as
  a `@method` tag writes them), `attributes()`, `returned_value()` and `returned_call()`, the first call on `$this` of what
  it returns, such as `#{ name: "hasMany", args: #{ "0": "App\\Comment" } }`.
- A **property** has `name`, `class`, `type`, `is_static`, `visibility` and `default_value`.

Values are only what's written out literally: strings, numbers, booleans, `null`, arrays of them, `Foo::class` as the
class's name, and constants with such values. Nothing's inferred from code, so that a class's members never depend on
checking the code that uses them. Asking about many methods is much cheaper all at once, with `method_details(names)`, or
`methods_below("App\\Model")` for those a class has that its ancestor hasn't.

The engine also has functions the built-in [framework support](/guide/frameworks) uses, such as `laravel_columns`,
`symfony_service` and `wordpress_hook`. They aren't meant for a project's scripts, and may change.

## The sandbox

Scripts can't reach files, the network or other programs, have no clock, randomness, `import` or `eval`, and keep nothing
between calls, so only their functions run and the same input gets the same answer.

| Limit | |
|---|---|
| operations in one call | 1,000,000 |
| depth of calls | 64; 16 [in the browser](/guide/browser) |
| size of a script | 1 MB |
| a string, an array, a map | 4 MB, 65,536 items, 16,384 entries |
| reports from one file | 10,000 |

A call that goes past one fails, and so does any other error in one: that's one `SPHP0070` at the script, and the script
sits out that file while the analysis goes on. A script that can't be read or doesn't compile is `SPHP0071`.

<<< @/examples/rules/rules/endless.rhai{rhai}

<<< @/examples/rules/output/endless.console{text}

`print` goes to the log, with `STIRPHP_LOG=stirphp::script=debug`, and `STIRPHP_LOG=info` says which scripts run.

## Who runs them

`stirphp check` runs what's configured, as you chose to run it in that project. An editor asks first, since opening a
repository shouldn't run code from it:

- In VS Code, a workspace you haven't trusted never runs them, and in a trusted one you're asked once for those exact
  scripts; see [Editor setup](/guide/editors#rules-and-workspace-trust).
- Other editors get the same question through `window/showMessageRequest`, and without an answer the scripts stay off. An
  editor that knows a workspace isn't trusted passes `"workspaceTrusted": false` in `initializationOptions`, and then they
  never run.
- [In the browser](/guide/browser), a page's scripts run without asking, since the page chose to load them.

## How fast

On Laravel's framework, Symfony and PHPStan's source, one rule on every function call and one return type hook add under
3% to the time of a run, and a rule call costs 14 to 34 microseconds of CPU time. So the editor runs them as part of its
diagnostics, per file, without a pass of their own.
