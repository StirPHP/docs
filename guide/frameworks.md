# Frameworks

StirPHP ships support for Laravel, Symfony, WordPress, Pest and Mockery: [scripts](/guide/rules) like a project's own, inside the binary,
with native code where reading many files would be slow in a script. They're part of StirPHP, so they run without anyone
being asked, in editors too, and they're never read from disk, so no file of a project can stand in for one. A project's
own scripts come first and can override what they say.

## When it's on

Each is on when the project uses that framework:

- **Laravel:** `laravel/framework` among Composer's packages.
- **Symfony:** `symfony/framework-bundle`, `symfony/symfony` or `symfony/dependency-injection`, unless the project is built
  on Laravel or Drupal.
- **WordPress:** `johnpbloch/wordpress-core`, `roots/wordpress` or `php-stubs/wordpress-stubs`, a `wp-config.php` or
  `wp-content` folder, or a plugin's `Plugin Name:` header in a file in the project's folder (or a theme's
  `Theme Name:` in `style.css`).
- **Pest:** `pestphp/pest` among Composer's packages.
- **Mockery:** `mockery/mockery` among Composer's packages.

`parameters.stirphp.frameworks` turns one off or on, over what's found:

<<< @/examples/wordpress/alt/stirphp.neon.next{neon} [stirphp.neon]

With this, the [WordPress plugin below](#wordpress) gets none of its errors:

<<< @/examples/wordpress/output/off.console{text}

## Laravel

- **Models** get properties for the columns their migrations in `database/migrations` create (by `$table`, or the class's
  name in plural, as Laravel has it), their `$casts` and `casts()`, accessors (`getFullNameAttribute()` and
  `fullName(): Attribute`) and relations, typed as what the relation gives. They accept anything when set, as Laravel
  converts it. An attribute nothing declares is `mixed` rather than an error, as migrations aren't always the whole story,
  so a misspelt column isn't reported.
- **Scopes** (`scopeActive()` and `#[Scope]`) are on the model and its queries, with their parameters. Calls a model hasn't
  got, statically or not, go to `Builder<Model>`, and a relation's go to a query of its related model; `where{Column}()`
  works on both, and so do query methods a model declares, such as `withTrashed()` from `SoftDeletes`.
- **Facades** forward to what their accessor names, by class or by the container's names for Laravel's services, and
  contracts such as `Illuminate\Contracts\Auth\Factory` to the class Laravel binds them to. `auth()->user()`,
  `Auth::user()` and `$request->user()` give the user model `config/auth.php` names. Laravel's class aliases, such as
  `\DB`, are there.
- **Macros** the project or a package adds with `Foo::macro('name', ..)` or `Foo::mixin(..)` aren't reported, though what
  they return isn't known.
- **Factories** know their model: `User::factory()->create()` is a `User`, and with `count()` a collection of them. A
  relation method with no generics in its PHPDoc gets its type from its body.
- In a closure given to `Artisan::command()` or the console kernel's `command()`, `$this` is the `ClosureCommand` Laravel
  binds it to; not in a static closure, which PHP can't bind.
- **Blade templates** are read as PHP where they hold PHP, with variables typed from what renders them. See
  [Blade](/guide/blade).
- **In an editor**, these complete, hover and lead to where they're declared: a relation's property to its method, a scope
  to its `scopeX` method. Going to the definition of `route('name')` finds `->name('name')` in `routes/`, and of
  `view('a.b')` the template in `resources/views`.

A small application, with the [`laravel` sample](/editor?sample=laravel) of the editor (whose `vendor/` has a few of
Laravel's classes, written for it):

::: code-group

<<< @/samples/laravel/app/Http/Controllers/PostController.php{php} [PostController.php]

<<< @/samples/laravel/resources/views/posts/index.blade.php{blade} [posts/index.blade.php]

<<< @/samples/laravel/app/Models/Post.php{php} [Post.php]

<<< @/samples/laravel/database/migrations/2026_01_01_000000_create_posts_table.php{php} [the migration]

:::

<<< @/samples/laravel/output/check.console{text}

The scope's parameter and the `views` column's type came from the model and its migration, and the template's `$posts` from
the controller. At level 8, `$post->author`
and `auth()->user()` would be reported as possibly `null`, as they are.

## Symfony and Doctrine

Services and parameters come from the compiled container,
`parameters.symfony.containerXmlPath` or else one in `var/cache/`, the `dev` environment's first, so
`$container->get('app.mailer')` and `$this->getParameter('kernel.debug')` have types. A container that hasn't been
compiled isn't compiled; then a `get(Foo::class)` is still a `Foo`. `getRepository(Product::class)` gives the repository
`#[ORM\Entity(repositoryClass: ..)]` names, and repositories have `findByX()`, `findOneByX()` and `countByX()`.

## WordPress

`php-stubs/wordpress-stubs` is loaded when it's installed, `global $wpdb;` and the other globals
WordPress sets up have their types, and `add_action()` and `add_filter()` are checked: a callback that isn't a function,
one that needs more arguments than `$accepted_args`, or takes fewer than it says, and `$accepted_args` above what any
`do_action()` or `apply_filters()` of that hook in the project passes (`wordpress.hookArguments`). Going to the definition
of a hook's name finds where it runs.

A plugin, with a few of WordPress's declarations standing in for `php-stubs/wordpress-stubs` in `vendor/`:

<<< @/examples/wordpress/greeter.php{php}

<<< @/examples/wordpress/output/check.console{text}

Without the stubs installed, WordPress's own functions, such as `add_action()`, are unknown.

## Pest and Mockery

In a Pest test, `$this` is the class `uses()` and `Pest.php` give that test's folder, and `expect()` knows its value. A mock
of `Foo` from Mockery is a `Foo` as well as a mock.

## Not there yet

Config keys of `config()`, the results of `$collection->map->name` (it's the property's type, not a collection of them),
relation names in `with()` and `has()`, route names in groups, `Request` input as more than `mixed`, Doctrine's `@ORM`
annotations in PHPDoc, Symfony forms, routes as a reason a method is used, and the return types of `apply_filters()` from
the hook's PHPDoc.
