<?php

declare(strict_types=1);

namespace App\Shop;

final readonly class Money
{
    public function __construct(
        public int $cents,
        public string $currency = 'EUR',
    ) {}

    public function add(Money $other): Money
    {
        if ($other->currency !== $this->currency) {
            throw new \InvalidArgumentException("Can't add {$other->currency} to {$this->currency}");
        }

        return new Money($this->cents + $other->cents, $this->currency);
    }

    public function format(): string
    {
        return sprintf('%s %d.%02d', $this->currency, intdiv($this->cents, 100), $this->cents % 100);
    }
}
