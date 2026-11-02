---
layout: home
title: StirPHP
titleTemplate: A typed superset of PHP

hero:
  name: PHP, with types
  text: you can trust.
  tagline: StirPHP is a strictly typed superset of PHP. Write .sphp, let the checker catch the bugs, and ship plain, readable PHP 8.4 with PHPStan-ready PHPDoc.
  image:
    src: /hero.svg
    alt: ''
  actions:
    - theme: brand
      text: Get started →
      link: /guide/installation
    - theme: alt
      text: Read the guide →
      link: /guide/

features:
  - title: Null safety
    details: 'String and String? are different types. ?->, ?:, !! and smart casts make every null visible, and untyped PHP values must be narrowed before use.'
  - title: No top type
    details: 'No mixed, no Any. Generics with bounds and variance are how code accepts "anything", and an unknown value can''t be used until it is narrowed.'
  - title: Values that say what they are
    details: 'val has no $ and never changes; var $x does. Records are typed arrays, data classes are immutable objects, sealed hierarchies make when exhaustive.'
  - title: Plain PHP out
    details: 'The compiler emits ordinary PHP 8.4 classes, functions and arrays with PHPDoc. No runtime magic: what you ship is what you can read.'
  - title: Gradual, like TypeScript
    details: 'Keep your .php files. Their PHPDoc is read the PHPStan way, phpstan.neon levels apply, and Composer dependencies are typed from their signatures.'
  - title: A real language server
    details: 'Diagnostics as you type, hover with narrowed types, go to definition, rename, completion of extension methods and inlay hints, in any LSP editor.'
---

## Write StirPHP, ship PHP

On the left is what you write; on the right, what `sphp build` emits. The
`when` is checked for exhaustiveness: drop a branch and the build fails.

::: code-group

```sphp [src/Shop.sphp]
namespace Shop

sealed interface Payment
data class Card(val last4: String) : Payment
data class Invoice(val days: Int) : Payment

record Line { name: String; cents: Int; qty: Int = 1 }

function total(lines: List<Line>): Int = lines->sumOf { it->cents * it->qty }

function describe(p: Payment?): String = when (p) {
    is Card -> "card ending ${p->last4}"
    is Invoice -> "invoice, due in ${p->days} days"
    null -> "not paid yet"
}
```

```php [build/Shop.php]
<?php

declare(strict_types=1);

namespace Shop;

require_once __DIR__ . '/stir-runtime.php';

interface Payment
{
}

final readonly class Card implements \Shop\Payment
{
    public function __construct(
        public string $last4,
    ) {
    }
}

final readonly class Invoice implements \Shop\Payment
{
    public function __construct(
        public int $days,
    ) {
    }
}

/** @param list<array{name: string, cents: int, qty: int}> $lines */
function total(array $lines): int
{
    return \Stir\List_sumOf($lines, fn (array $it): int => $it['cents'] * $it['qty']);
}

function describe(?\Shop\Payment $p): string
{
    return match (true) {
        $p instanceof \Shop\Card => "card ending {$p->last4}",
        $p instanceof \Shop\Invoice => "invoice, due in {$p->days} days",
        $p === null => 'not paid yet',
    };
}
```

:::

## Install

::: code-group

```sh [Linux and macOS]
curl -fsSL https://stirphp.github.io/core/install.sh | sh
```

```powershell [Windows]
irm https://stirphp.github.io/core/install.ps1 | iex
```

:::

## Three commands

<div class="steps">

<div class="step"><span>01</span><strong>sphp init</strong><p>Creates <code>sphp.toml</code> and a first <code>src/main.sphp</code>.</p></div>

<div class="step"><span>02</span><strong>sphp check</strong><p>Type-checks the project: StirPHP files strictly, your <code>.php</code> files at their PHPStan level.</p></div>

<div class="step"><span>03</span><strong>sphp build</strong><p>Writes plain PHP to <code>build/</code>, with source maps. <code>--watch</code> rebuilds on save.</p></div>

</div>

[More ways to install →](/guide/installation)
