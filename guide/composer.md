# Composer

StirPHP reads `composer.json` and what `composer install` leaves in `vendor/`: the autoload rules, of the project and of
its packages, and the list of installed packages. It never runs Composer, and never runs anything in `vendor/`.

From them it knows:

- **Your sources:** the folders of the project's own autoload rules, and its other PHP, such as `routes/`. `vendor/` is never
  the project's, so what's in it isn't reported.
- **Your packages' classes and functions,** found through their autoload rules as PHP would find them, including
  `classmap`, `files` and `exclude-from-classmap`. `--no-vendor` on the command line leaves them out.
- **The PHP version:** `config.platform.php`, then `require.php`. See [PHP versions](/guide/php-versions).
- **PHP's extensions:** the `ext-*` the project or its packages require or suggest.
- **Frameworks,** from the packages: see [Frameworks](/guide/frameworks).
- **PHPStan's extensions,** from `extra.phpstan.includes`, so their NEON configuration is read as PHPStan's extension
  installer would add it. Their PHP code isn't run.

`parameters.stirphp.composer` names `composer.json` if it isn't in the project folder. Without `composer.json`, the project
folder is where the sources are, and `vendor/` is read only if it's there.

## Packages that aren't installed

If packages are declared but not installed, or the install isn't up to date with `composer.lock`, StirPHP says so and tells
you to run `composer install`. Until then, errors about what those packages would declare are held back, so you don't get an
error for each class you use from them. Other errors are still reported:

<<< @/examples/composer/composer.json{json}

<<< @/examples/composer/src/Logs.php{php}

<<< @/examples/composer/output/check.console{text}

`Monolog\Logger` would come from a package, so it isn't reported. `App\Mailer` is in the project's own namespace, so it
is. `stirphp check` prints the notice and how many were held back, and an editor shows it once. In an editor, the notice
goes when `vendor/composer/installed.json` or `composer.lock` changes and the install is complete.
