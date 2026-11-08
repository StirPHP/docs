<?php

function total(array $prices): int
{
    $sum = 0;
    foreach ($prices as $price) {
        $sum += $price;
    }
    return number_format($sum);
}

function first_name(?string $name): string
{
    return ucfirst(trim($name ?? '')) . missing_helper();
}

function last_name(): string
{
    return other_missing_helper();
}
