# Your first project

This assumes `sphp` is [installed](./installation).

## Create it

```sh
mkdir hello && cd hello
sphp init --yes
```

`sphp init` asks for a name and the source and output directories; `--yes`
takes the defaults. It writes:

- `sphp.toml`, the project configuration (see [Configuration](./configuration))
- `src/main.sphp`, a first program
- a `.gitignore` entry for the output directory

## Check it

```sh
sphp check
```

`sphp check` type-checks every file under `src/`. Errors are shown with their
location and a stable code you can look up in [Diagnostics](./diagnostics):

```
error[SPHP0005]: type mismatch in declaration: "ten" is not assignable to Int
   ╭─[ src/main.sphp:3:14 ]
   │
 3 │ val n: Int = "ten"
   │              ──┬──
   │                ╰──── type mismatch in declaration: "ten" is not assignable to Int
───╯
```

## Build it

```sh
sphp build
php build/main.php
```

`sphp build` checks the project, then writes one `.php` file (and a `.php.map`
source map) per source file to `build/`. Code that uses the standard library
also gets `build/stir-runtime.php`, which the generated files `require`.

While you work, keep it rebuilding:

```sh
sphp build --watch
```

## Use it from PHP

The output is plain PHP: load it with Composer like any other code.

```json
{
    "autoload": { "classmap": ["build/"] }
}
```

From here, the [Language](./bindings) section walks through StirPHP itself.
