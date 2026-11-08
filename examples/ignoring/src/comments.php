<?php

function size(): int
{
    return 'big'; // @phpstan-ignore return.type
}

function width(): int
{
    // @phpstan-ignore-next-line
    return 'wide';
}

function height(): int
{
    return 'tall'; // @phpstan-ignore argument.type
}

function depth(): int
{
    /** @phpstan-ignore return.type */
    return 'deep';
}
