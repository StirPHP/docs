<?php

final class Status
{
    const string ACTIVE = 'active';

    public function __construct(
        public private(set) string $name,
    ) {}
}

function first_active(array $statuses): ?string
{
    return array_find($statuses, fn (string $s): bool => $s === Status::ACTIVE);
}

function label(?string $name = null): string
{
    return $name ?? 'none';
}
