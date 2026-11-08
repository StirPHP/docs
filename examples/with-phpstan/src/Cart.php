<?php

final class Cart
{
    /** @var array<string, int> */
    private array $items = [];

    private \ArrayIterator $history;

    public function add(string $sku, int $quantity): void
    {
        $this->items[$sku] = $quantity;
        $this->history = new \ArrayIterator($this->items);
    }

    public function quantity(string $sku): int
    {
        return $this->items[$sku] ?? 'none';
    }

    public function skus()
    {
        return array_keys($this->items);
    }
}
