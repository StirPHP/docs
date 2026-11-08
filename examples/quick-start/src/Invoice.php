<?php

namespace App;

final class Invoice
{
    /** @param list<int> $lines amounts in cents */
    public function __construct(private array $lines) {}

    public function label(): string
    {
        return 'Total: ' . $this->totl();
    }

    public function find(int $cents): ?int
    {
        foreach ($this->lines as $line) {
            if ($line === $cents) {
                return $line;
            }
        }
        return null;
    }

    public function count(): int
    {
        return "many";
    }
}
