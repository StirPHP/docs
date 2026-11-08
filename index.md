---
layout: home
title: StirPHP
titleTemplate: Type checking for plain PHP

hero:
  name: Type safety for PHP,
  text: free and in your editor.
  tagline: StirPHP is a type checker and language server for plain PHP. It reads your code, its PHPDoc and your Composer setup as they are, with nothing to migrate to and no configuration needed.
  image:
    src: /hero.svg
    alt: ''
  actions:
    - theme: brand
      text: Get started →
      link: /guide/quick-start
    - theme: alt
      text: Try it in the browser →
      link: /editor

features:
  - title: Plain PHP
    details: 'Your .php files, their PHPDoc and your Composer packages, read as they are. Nothing to rewrite, no new syntax, no runtime.'
  - title: PHPStan's identifiers and levels
    details: 'Levels 0 to 10, @phpstan-ignore, ignoreErrors and baselines work the way PHPStan has them, and PHPStan can run alongside for what StirPHP lacks.'
  - title: A language server
    details: 'Diagnostics as you type, hover, completion that adds use lines, go to definition into packages and stubs, rename, inlay hints, quick fixes and refactorings.'
  - title: Your PHP version
    details: 'Syntax and library functions are checked against the version composer.json or your configuration targets.'
  - title: Laravel, Symfony and WordPress
    details: 'Models, scopes, facades, container services and hooks are understood, without running PHP.'
  - title: Rules in a sandbox
    details: 'Custom rules and type hooks are Rhai scripts, which can''t touch files or the network, on the command line, in an editor and in the browser.'
---

## Why

The goal is the best open source language server for PHP, as good as PhpStorm's engine. Type safety shouldn't depend on
being able to pay for a licence, and it should work live in the editor. It isn't there yet: see
[its current state](/guide/#current-state).

## Install

::: code-group

```sh [Linux and macOS]
curl -fsSL https://stirphp.github.io/core/install.sh | sh
```

```powershell [Windows]
irm https://stirphp.github.io/core/install.ps1 | iex
```

:::

Then, in a project's folder:

```sh
stirphp check
```

[More ways to install, and VS Code →](/guide/installation)
