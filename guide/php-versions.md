# PHP versions

The analysis follows the PHP version your project targets, as its own dialect: the syntax you can use, the behaviour that
differs between versions, and the functions and classes PHP's library has.

## Which version

The first of these that's set:

1. PHPStan's `phpVersion` in the [configuration](/guide/configuration): `80300`, or a range such as
   `{min: 80100, max: 80400}`
2. Composer's `config.platform.php`
3. Composer's `require.php`, using the lowest version it allows
4. Otherwise, the latest

## What's checked against it

- **Syntax:** everything parses, and syntax newer than the target is an error that names the version that added it, such as
  typed class constants on 8.2, or property hooks on 8.3.
- **Behaviour:** what differs between versions follows the target. For example `string $s = null`, an implicitly
  nullable parameter, is a warning (`parameter.implicitlyNullable`) from 8.4, which deprecated it, and fine before.
- **Library:** functions, classes and their signatures come from PHP's stubs for that version, so using something added
  later, or removed earlier, is reported.
- **Editors:** completion and hover follow it too, so they don't suggest what the project can't use.

Code in `vendor/` is read whatever its version, but isn't reported.

## An example

With `"php": "^8.2"` in `composer.json`:

<<< @/examples/php-version/src/Status.php{php}

<<< @/examples/php-version/output/check.console{text}

Where PHPStan has a rule for a piece of syntax, its identifier is used, as `classConstant.nativeTypeNotSupported` above.
Otherwise it's `SPHP0060`, and `SPHP0061` for PHP's library. As in PHPStan, those with PHPStan's identifiers can't be
[ignored](/guide/levels#in-the-code), since PHP wouldn't run the file; the [reference](/reference/diagnostics#newer-syntax-than-the-project-s-php-version)
lists them.

With `phpVersion: 80400` in a `stirphp.neon`, which comes before `composer.json`, the same code is fine:

<<< @/examples/php-version/alt/stirphp.neon.next{neon} [stirphp.neon]

<<< @/examples/php-version/output/check-84.console{text}
