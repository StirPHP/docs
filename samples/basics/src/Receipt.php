<?php

declare(strict_types=1);

namespace App;

use App\Shop\Cart;

final class Receipt
{
    public function __construct(private Cart $cart) {}

    public function render(string $customer): string
    {
        $lines = [];
        $lines[] = 'Receipt for ' . ucfirst($customer);
        $lines[] = str_repeat('=', 20);
        $total = $this->cart->total();
        $lines[] = 'Total: ' . $total->format();

        return implode("\n", $lines);
    }

    public function shipping(): Money
    {
        return new Money(495);
    }
}
