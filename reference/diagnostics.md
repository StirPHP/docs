---
outline: [2, 2]
---

<!-- Written by scripts/gen-reference.mjs from StirPHP 0.1.21; don't edit it by hand. -->

# Diagnostics

Every identifier `stirphp check` and the language server report, from StirPHP 0.1.21's source. Where one of
PHPStan's rules checks the same thing, the identifier is PHPStan's and links to its page; `SPHP` codes are StirPHP's own.

- **Level** is the lowest [level](/guide/levels) that reports it. Some reports of a code need a higher one: an argument that
  may be `null` is level 8, a union with only some members wrong is level 7, and `mixed` is level 9 or 10, as in PHPStan.
- **Ignorable** says whether `@phpstan-ignore`, `ignoreErrors` and baselines can hide it. What PHP itself won't run, such as
  a syntax error, can't be hidden.

The list is generated from the source by `scripts/gen-reference.mjs` in the docs repository.

## Levels

| Level | What it adds |
|---|---|
| 0 | unknown classes/functions/constants/variables, members on `$this`, wrong argument counts on it, static access, syntax |
| 2 | the same on any other value, PHPDoc validation (PHPDoc vs native types, generic arity, bounds, variance), visibility, invalid operators and callables |
| 3 | return types, property types, other assignments, PHPDoc types of overrides, iterating and indexing, writes to readonly properties |
| 4 | code nothing can reach, and conditions and comparisons that can only go one way |
| 5 | argument types |
| 6 | types left out: of parameters, returns and properties, and of what arrays hold |
| 7 | what can be right but isn't always: unions with a right member, `object` for a class, `string` for a `non-empty-string` |
| 8 | nullable values, as arguments and when reached through |
| 9 | explicit `mixed` |
| 10 | implicit `mixed`: no type at all |

Level 1 adds `constant.notFound` and `nullCoalesce.variable`. Without configuration the level is 5, and
`level: max` is 10.

## PHPStan's identifiers

| Identifier | Level | Ignorable | |
|---|---|---|---|
| [`phpstan.parse`](https://phpstan.org/error-identifiers/phpstan.parse) | 0 | no | A syntax error: PHP can't parse the file. |
| [`arguments.count`](https://phpstan.org/error-identifiers/arguments.count) | 0 | yes |  |
| [`argument.missing`](https://phpstan.org/error-identifiers/argument.missing) | 0 | yes |  |
| [`argument.type`](https://phpstan.org/error-identifiers/argument.type) | 5 | yes |  |
| [`argument.unknown`](https://phpstan.org/error-identifiers/argument.unknown) | 0 | yes |  |
| [`assign.propertyProtectedSet`](https://phpstan.org/error-identifiers/assign.propertyProtectedSet) | 2 | yes |  |
| [`assign.propertyReadOnly`](https://phpstan.org/error-identifiers/assign.propertyReadOnly) | 2 | yes |  |
| [`assign.propertyType`](https://phpstan.org/error-identifiers/assign.propertyType) | 3 | yes |  |
| [`assign.this`](https://phpstan.org/error-identifiers/assign.this) | 0 | no |  |
| [`callable.nonCallable`](https://phpstan.org/error-identifiers/callable.nonCallable) | 2 | yes |  |
| [`classConstant.notFound`](https://phpstan.org/error-identifiers/classConstant.notFound) | 0 | yes |  |
| [`class.notFound`](https://phpstan.org/error-identifiers/class.notFound) | 0 | yes |  |
| [`class.noParent`](https://phpstan.org/error-identifiers/class.noParent) | 0 | yes |  |
| [`constant.notFound`](https://phpstan.org/error-identifiers/constant.notFound) | 1 | yes |  |
| [`foreach.nonIterable`](https://phpstan.org/error-identifiers/foreach.nonIterable) | 3 | yes |  |
| [`function.notFound`](https://phpstan.org/error-identifiers/function.notFound) | 0 | yes |  |
| [`generics.moreTypes`](https://phpstan.org/error-identifiers/generics.moreTypes) | 2 | yes |  |
| [`generics.notGeneric`](https://phpstan.org/error-identifiers/generics.notGeneric) | 2 | yes |  |
| [`generics.notSubtype`](https://phpstan.org/error-identifiers/generics.notSubtype) | 2 | yes |  |
| [`generics.variance`](https://phpstan.org/error-identifiers/generics.variance) | 2 | yes |  |
| [`ignore.parseError`](https://phpstan.org/error-identifiers/ignore.parseError) | 0 | no |  |
| [`interface.notFound`](https://phpstan.org/error-identifiers/interface.notFound) | 0 | yes |  |
| [`method.childParameterType`](https://phpstan.org/error-identifiers/method.childParameterType) | 0 | yes |  |
| [`method.childReturnType`](https://phpstan.org/error-identifiers/method.childReturnType) | 0 | yes |  |
| [`method.nonObject`](https://phpstan.org/error-identifiers/method.nonObject) | 2 | yes |  |
| [`method.notFound`](https://phpstan.org/error-identifiers/method.notFound) | 0 | yes |  |
| [`method.private`](https://phpstan.org/error-identifiers/method.private) | 0 | yes |  |
| [`method.protected`](https://phpstan.org/error-identifiers/method.protected) | 0 | yes |  |
| [`missingType.iterableValue`](https://phpstan.org/error-identifiers/missingType.iterableValue) | 6 | yes |  |
| [`missingType.parameter`](https://phpstan.org/error-identifiers/missingType.parameter) | 6 | yes |  |
| [`missingType.property`](https://phpstan.org/error-identifiers/missingType.property) | 6 | yes |  |
| [`missingType.return`](https://phpstan.org/error-identifiers/missingType.return) | 6 | yes |  |
| [`new.abstract`](https://phpstan.org/error-identifiers/new.abstract) | 0 | yes |  |
| [`new.enum`](https://phpstan.org/error-identifiers/new.enum) | 0 | yes |  |
| [`new.interface`](https://phpstan.org/error-identifiers/new.interface) | 0 | yes |  |
| [`new.static`](https://phpstan.org/error-identifiers/new.static) | 0 | yes |  |
| [`new.trait`](https://phpstan.org/error-identifiers/new.trait) | 0 | yes |  |
| [`nullsafe.assign`](https://phpstan.org/error-identifiers/nullsafe.assign) | 0 | no |  |
| [`nullCoalesce.variable`](https://phpstan.org/error-identifiers/nullCoalesce.variable) | 1 | yes |  |
| [`offsetAssign.valueType`](https://phpstan.org/error-identifiers/offsetAssign.valueType) | 3 | yes |  |
| [`offsetAccess.nonOffsetAccessible`](https://phpstan.org/error-identifiers/offsetAccess.nonOffsetAccessible) | 3 | yes |  |
| [`offsetAccess.notFound`](https://phpstan.org/error-identifiers/offsetAccess.notFound) | 3 | yes |  |
| [`outOfClass.parent`](https://phpstan.org/error-identifiers/outOfClass.parent) | 0 | yes |  |
| [`outOfClass.self`](https://phpstan.org/error-identifiers/outOfClass.self) | 0 | yes |  |
| [`outOfClass.static`](https://phpstan.org/error-identifiers/outOfClass.static) | 0 | yes |  |
| [`parameter.defaultValue`](https://phpstan.org/error-identifiers/parameter.defaultValue) | 2 | yes |  |
| [`parameter.implicitlyNullable`](https://phpstan.org/error-identifiers/parameter.implicitlyNullable) | 0 | yes |  |
| [`parameter.missing`](https://phpstan.org/error-identifiers/parameter.missing) | 0 | yes |  |
| [`parameter.notOptional`](https://phpstan.org/error-identifiers/parameter.notOptional) | 0 | yes |  |
| [`parameter.phpDocType`](https://phpstan.org/error-identifiers/parameter.phpDocType) | 2 | yes |  |
| [`property.defaultValue`](https://phpstan.org/error-identifiers/property.defaultValue) | 3 | yes |  |
| [`property.nonObject`](https://phpstan.org/error-identifiers/property.nonObject) | 2 | yes |  |
| [`property.notFound`](https://phpstan.org/error-identifiers/property.notFound) | 0 | yes |  |
| [`property.phpDocType`](https://phpstan.org/error-identifiers/property.phpDocType) | 2 | yes |  |
| [`property.private`](https://phpstan.org/error-identifiers/property.private) | 0 | yes |  |
| [`property.protected`](https://phpstan.org/error-identifiers/property.protected) | 0 | yes |  |
| [`property.readOnlyAssignNotInConstructor`](https://phpstan.org/error-identifiers/property.readOnlyAssignNotInConstructor) | 3 | yes |  |
| [`property.readOnlyAssignOutOfClass`](https://phpstan.org/error-identifiers/property.readOnlyAssignOutOfClass) | 3 | yes |  |
| [`classConstant.phpDocType`](https://phpstan.org/error-identifiers/classConstant.phpDocType) | 2 | yes |  |
| [`return.missing`](https://phpstan.org/error-identifiers/return.missing) | 0 | yes |  |
| [`return.phpDocType`](https://phpstan.org/error-identifiers/return.phpDocType) | 2 | yes |  |
| [`return.type`](https://phpstan.org/error-identifiers/return.type) | 3 | yes |  |
| [`return.void`](https://phpstan.org/error-identifiers/return.void) | 3 | yes |  |
| [`staticMethod.notFound`](https://phpstan.org/error-identifiers/staticMethod.notFound) | 0 | yes |  |
| [`staticMethod.private`](https://phpstan.org/error-identifiers/staticMethod.private) | 0 | yes |  |
| [`staticMethod.protected`](https://phpstan.org/error-identifiers/staticMethod.protected) | 0 | yes |  |
| [`staticProperty.notFound`](https://phpstan.org/error-identifiers/staticProperty.notFound) | 0 | yes |  |
| [`staticProperty.private`](https://phpstan.org/error-identifiers/staticProperty.private) | 0 | yes |  |
| [`staticProperty.protected`](https://phpstan.org/error-identifiers/staticProperty.protected) | 0 | yes |  |
| [`throw.notThrowable`](https://phpstan.org/error-identifiers/throw.notThrowable) | 3 | yes |  |
| [`trait.notFound`](https://phpstan.org/error-identifiers/trait.notFound) | 0 | yes |  |
| [`typeAlias.notFound`](https://phpstan.org/error-identifiers/typeAlias.notFound) | 0 | yes |  |
| [`variable.undefined`](https://phpstan.org/error-identifiers/variable.undefined) | 0 | yes |  |

## Newer syntax than the project's PHP version

Reported when the project's [PHP version](/guide/php-versions) is older than the syntax.

| Identifier | Level | Ignorable | |
|---|---|---|---|
| [`argument.namedNotSupported`](https://phpstan.org/error-identifiers/argument.namedNotSupported) | 0 | no |  |
| [`callable.notSupported`](https://phpstan.org/error-identifiers/callable.notSupported) | 0 | no |  |
| [`cast.voidNotSupported`](https://phpstan.org/error-identifiers/cast.voidNotSupported) | 0 | no |  |
| [`catch.nonCapturingNotSupported`](https://phpstan.org/error-identifiers/catch.nonCapturingNotSupported) | 0 | no |  |
| [`classConstant.dynamicFetch`](https://phpstan.org/error-identifiers/classConstant.dynamicFetch) | 0 | no |  |
| [`classConstant.finalNotSupported`](https://phpstan.org/error-identifiers/classConstant.finalNotSupported) | 0 | no |  |
| [`classConstant.inTrait`](https://phpstan.org/error-identifiers/classConstant.inTrait) | 0 | no |  |
| [`classConstant.nativeTypeNotSupported`](https://phpstan.org/error-identifiers/classConstant.nativeTypeNotSupported) | 0 | no | Also what PHPStan's rule for readonly classes reports them as. |
| [`classConstant.notSupported`](https://phpstan.org/error-identifiers/classConstant.notSupported) | 0 | no |  |
| [`constant.attributesNotSupported`](https://phpstan.org/error-identifiers/constant.attributesNotSupported) | 0 | no |  |
| [`parameter.unionTypeNotSupported`](https://phpstan.org/error-identifiers/parameter.unionTypeNotSupported) | 0 | no |  |
| [`property.hooksNotSupported`](https://phpstan.org/error-identifiers/property.hooksNotSupported) | 0 | no |  |
| [`property.promotedNotSupported`](https://phpstan.org/error-identifiers/property.promotedNotSupported) | 0 | no |  |
| [`property.readOnlyNotSupported`](https://phpstan.org/error-identifiers/property.readOnlyNotSupported) | 0 | no |  |
| [`property.staticAsymmetricVisibility`](https://phpstan.org/error-identifiers/property.staticAsymmetricVisibility) | 0 | no |  |
| [`return.neverTypeNotSupported`](https://phpstan.org/error-identifiers/return.neverTypeNotSupported) | 0 | no |  |
| [`return.unionTypeNotSupported`](https://phpstan.org/error-identifiers/return.unionTypeNotSupported) | 0 | no |  |
| [`throw.notSupported`](https://phpstan.org/error-identifiers/throw.notSupported) | 0 | no |  |

## StirPHP's own codes

| Code | Level | Ignorable | |
|---|---|---|---|
| `SPHP0005` | 3 | yes | An assignment to something else than a property or an offset: `$$name = ...`. |
| `SPHP0060` | 0 | yes | Syntax newer than the project's PHP version, where PHPStan has no rule for it. |
| `SPHP0061` | 0 | yes | Something of PHP's library that isn't on the project's PHP version. |
| `SPHP0062` | 0 | yes | A class that can be created, but has abstract methods nothing implements: PHP won't load it. |
| `SPHP0080` | 0 | yes | An import nothing uses: not an error, only a hint for an editor to grey it out. |
| `SPHP0070` | 0 | no | A project's script failed while running: it took too long, or its code went wrong. |
| `SPHP0071` | 0 | no | A project's script can't run at all: it can't be read, or it doesn't compile. |

`SPHP0080` is only a hint, for an editor to grey out an unused import; `stirphp check` doesn't report it.

## Built as the checker goes

These identifiers are put together from what's found, so they're listed by family.

| Identifiers | Level | Ignorable | |
|---|---|---|---|
| `if.alwaysTrue`<br>`if.alwaysFalse`<br>`elseif.alwaysTrue`<br>`elseif.alwaysFalse`<br>`ternary.alwaysTrue`<br>`ternary.alwaysFalse` | 4 | yes | A condition that can only go one way. |
| `booleanNot.alwaysTrue`<br>`booleanNot.alwaysFalse` | 4 | yes | `!$x` where `$x` can only be one thing. |
| `booleanAnd.leftAlwaysTrue`<br>`booleanAnd.leftAlwaysFalse`<br>`booleanAnd.rightAlwaysTrue`<br>`booleanAnd.rightAlwaysFalse`<br>`booleanOr.leftAlwaysTrue`<br>`booleanOr.leftAlwaysFalse`<br>`booleanOr.rightAlwaysTrue`<br>`booleanOr.rightAlwaysFalse`<br>`logicalAnd.leftAlwaysTrue`<br>`logicalAnd.leftAlwaysFalse`<br>`logicalAnd.rightAlwaysTrue`<br>`logicalAnd.rightAlwaysFalse`<br>`logicalOr.leftAlwaysTrue`<br>`logicalOr.leftAlwaysFalse`<br>`logicalOr.rightAlwaysTrue`<br>`logicalOr.rightAlwaysFalse` | 4 | yes | A side of `&&`, `\|\|`, `and` or `or` that can only be one thing. |
| `identical.alwaysTrue`<br>`identical.alwaysFalse`<br>`notIdentical.alwaysTrue`<br>`notIdentical.alwaysFalse` | 4 | yes | `===` or `!==` that can only go one way. |
| `deadCode.unreachable` | 4 | yes | A statement nothing can reach. |
| `return.never` | 0 | yes | A function declared `never` whose end can be reached. |
| `function.deprecated`<br>`constant.deprecated` | see below | yes | Use of a deprecated function or global constant. |
| `method.deprecated`<br>`method.deprecatedClass`<br>`method.deprecatedInterface`<br>`method.deprecatedTrait`<br>`method.deprecatedEnum`<br>`staticMethod.deprecated`<br>`staticMethod.deprecatedClass`<br>`staticMethod.deprecatedInterface`<br>`staticMethod.deprecatedTrait`<br>`staticMethod.deprecatedEnum`<br>`property.deprecated`<br>`property.deprecatedClass`<br>`property.deprecatedInterface`<br>`property.deprecatedTrait`<br>`property.deprecatedEnum`<br>`staticProperty.deprecated`<br>`staticProperty.deprecatedClass`<br>`staticProperty.deprecatedInterface`<br>`staticProperty.deprecatedTrait`<br>`staticProperty.deprecatedEnum`<br>`classConstant.deprecated`<br>`classConstant.deprecatedClass`<br>`classConstant.deprecatedInterface`<br>`classConstant.deprecatedTrait`<br>`classConstant.deprecatedEnum` | see below | yes | Use of a deprecated member (`.deprecated`), or of a member of a deprecated class-like (`.deprecatedClass` and so on). |
| `new.deprecatedClass`<br>`class.extendsDeprecatedClass`<br>`interface.extendsDeprecatedInterface`<br>`class.implementsDeprecatedInterface`<br>`enum.implementsDeprecatedInterface`<br>`traitUse.deprecatedTrait`<br>`parameter.deprecatedClass`<br>`parameter.deprecatedInterface`<br>`parameter.deprecatedEnum`<br>`return.deprecatedClass`<br>`return.deprecatedInterface`<br>`return.deprecatedEnum` | see below | yes | A deprecated class-like named in `new`, `extends`, `implements`, `use` or a parameter's or return type. |
| `wordpress.hookArguments` | 0 | yes | `add_action()` or `add_filter()` taking more arguments than any `do_action()` or `apply_filters()` of the hook passes. From the WordPress support. |

Deprecations are reported by `stirphp check` only with `parameters.stirphp.deprecations: true`, or when
`phpstan-deprecation-rules` is among PHPStan's extensions; then at every level, as warnings. An editor strikes
deprecated names through either way.

## Your own

[Rules](/guide/rules) report under the identifiers they give, such as `app.noVarDump`, at every level unless they say
otherwise.
