# Blade

StirPHP reads `.blade.php` files as Laravel's Blade templates. The PHP inside one gets what PHP gets everywhere else:
errors, hover, completion, go to definition, rename. The variables have the types that the code rendering the template
gives them, and nothing needs to be configured.

You can try it in the [`laravel` sample](/editor?sample=laravel) of the editor.

A controller, and a template it renders, with some mistakes in it:

::: code-group

<<< @/examples/blade/resources/views/posts/show.blade.php{blade} [posts/show.blade.php]

<<< @/examples/blade/app/Http/Controllers/PostController.php{php} [PostController.php]

<<< @/examples/blade/app/View/Components/ViewCount.php{php} [ViewCount.php]

:::

<<< @/examples/blade/output/check.console{text}

## What's checked

Tags and directives are recognised exactly as Laravel's compiler finds them. Anything else stays HTML: `@click`, `@media`,
`you@example.com`, and any `@name` Blade doesn't have.

These are checked as PHP:

- `{{ }}` and `{!! !!}`, in text and in attribute values
- the arguments of directives, `@class` and `@style` among them
- `@php ... @endphp`, and `<?php ... ?>`
- `:attr` values of a component tag

`::attr` is text, kept for the browser, as Blade has it.

## Where variables get their types

A template's variables are typed from everything that renders it, as a union if there's more than one type:

- `view()`, `View::make()` and `Route::view()`, with an array or `compact()`, and `->with()`
- `@include` with data, and `@extends`, which passes on what the child has
- mailables that name it
- component tags

A template is **open** when one of its sources can't be read, or may not be there to read:

- a view name worked out when the code runs, as in `view($page)`, opens every template
- `View::share()` and view composers
- Livewire's views, error pages under `errors/`, and package views published to `vendor/`
- a template nothing in the project renders

In an open template, a variable nobody declares is unknown, not an error. An undefined variable is reported only when
every source is understood and none of them gives it.

With `view($page, compact('post'))` in the controller above, every template is open, and only what doesn't depend on
what they're given is left:

<<< @/examples/blade/output/open.console{text}

All of this needs the project to look like a Laravel application: `laravel/framework` among its packages, a
`bootstrap/app.php`, and views in `resources/views`. Setting `paths` in the [configuration](/guide/configuration) also makes
templates open, since not all of the project is looked at then.

## Components

`<x-name>` goes to a class in `app/View/Components`, or to a template in `resources/views/components`.

- Attributes are checked against the class's constructor. `max-views` is the parameter `$maxViews`, and PHP's weak coercion
  applies, so `max-views="12"` is fine for an `int`, and an object isn't.
- Attributes the constructor doesn't name are fine: they go to `$attributes`.
- A component that can't be found isn't reported, though what's in its `:attr` values is checked.
- A slot runs in the scope of the template that wrote it, not the component's.

In an editor, a tag and its attributes hover and go to their definition, and names complete after `<x-`.

## Stating a type by hand

Where nothing says what a variable is, say it with `/** @var Type $name */`, in `@php` or `<?php`. `@use` imports a name
for the template, written with single backslashes:

<<< @/examples/blade/resources/views/emails/receipt.blade.php{blade}

## Outside Laravel

In a project without Laravel, a `.blade.php` file gets no errors for names that aren't known: `route()`, `Str::`,
`new App\Thing`. The rest is checked:

<<< @/examples/blade-outside/page.blade.php{blade}

<<< @/examples/blade-outside/output/check.console{text}

## Limits

- Some checks are off in templates: conditions that are always true or false, unreachable code, and properties only
  `__get` knows of.
- `Auth::user()` and `$request->user()` are taken as not `null`, since an `@auth` or a route's middleware may be in another
  file.
- Directives a project adds with `Blade::directive` aren't checked.
- Livewire, Volt and Filament have no specific support.
- The [formatter](/guide/formatter) leaves templates alone.
- Refactorings such as extract function work only inside `@php` or `<?php`.
