# Working with PHP

StirPHP is designed to be adopted gradually, the way TypeScript is adopted in
a JavaScript codebase.

## Calling PHP from StirPHP

PHP's functions and classes, and those of your Composer dependencies, can be
used directly:

```sphp
val parts = explode(",", "a,b,c")
val now = new \DateTimeImmutable()
echo now->format("Y-m-d")
```

How a PHP declaration's types are seen from StirPHP:

| PHP declares | StirPHP sees |
|---|---|
| A native type (`int`, `?string`, `array`) | That type, trusted: PHP enforces it |
| A native type refined by PHPDoc (`array` + `@return string[]`) | The PHPDoc type |
| Only a PHPDoc type | A platform type `T!`: probably `T`, unchecked |
| Nothing | `Any!`: unknown, [narrow it before use](./types#untyped-php-values-any) |

Signatures of PHP's own functions come from JetBrains'
[phpstorm-stubs](https://github.com/JetBrains/phpstorm-stubs), for the
target PHP version.

## Plain .php files in a project

With `allowPhp` (on by default), `.php` files under `srcDir` are part of the
project: StirPHP code sees their declarations, and `sphp build` copies them to
the output unchanged.

They are only type-checked when you ask for it:

- `checkPhp = true` in [`sphp.toml`](./configuration) checks every `.php` file;
- a `// @sphp-check` comment at the top of a file opts that file in, and
  `// @sphp-nocheck` opts it out.

Checked `.php` files are read like PHPStan reads them: native types plus
PHPDoc (`@param`, `@return`, `@var`, `@template`, array shapes, `list<T>`,
`int<0, max>`, `@phpstan-type`, ...). If the project has a `phpstan.neon`,
its `level` decides which problems are reported in `.php` files and its
`ignoreErrors` are honoured. `.sphp` files are always fully checked.

## Composer dependencies

When the project has a `composer.json`, the files its autoload rules reach,
including those of installed packages in `vendor/`, are loaded for their
declarations. They are never checked.

## Calling StirPHP from PHP

The generated code is ordinary PHP, so PHP code uses it like any other:

- classes, interfaces and functions keep their names and namespaces;
- [records](./records) are arrays with the record's keys;
- `List`/`Map` values are arrays; function types are `Closure`s;
- an extension function `function String.shout()` in namespace `App` is the
  function `\App\String_shout($string)`.

Generated classes are `final` unless declared `open`, and an `open` method
can be overridden by a PHP subclass even without type declarations.
