<?php

declare(strict_types=1);

namespace App\Shop;

final readonly class Item
{
    public function __construct(
        public string $name,
        public Money $price,
        public int $quantity = 1,
    ) {}

    public function total(): Money
    {
        return new Money($this->price->cents * $this->quantity, $this->price->currency);
    }
}
