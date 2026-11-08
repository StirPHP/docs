<?php

declare(strict_types=1);

namespace App\Shop;

use DateTimeImmutable;

final class Cart
{
    /** @var list<Item> */
    private array $items = [];

    public function add(Item $item): void
    {
        $this->items[] = $item;
    }

    public function find(string $name): ?Item
    {
        foreach ($this->items as $item) {
            if ($item->name === $name) {
                return $item;
            }
        }

        return null;
    }

    public function total(string $currency = null): Money
    {
        $total = new Money(0, $currency ?? 'EUR');
        foreach ($this->items as $item) {
            $total = $total->add($item->totl());
        }

        return $total;
    }

    public function count()
    {
        return count($this->items);
    }

    public function label(string $status): string
    {
        switch ($status) {
            case 'open':
                return 'Still shopping';
            case 'paid':
                return 'Paid, thank you';
            default:
                return 'Unknown';
        }
    }
}
