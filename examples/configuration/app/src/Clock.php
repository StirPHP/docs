<?php

namespace App;

final class Clock
{
    /** @deprecated use now() */
    public function time(): int
    {
        return time();
    }

    public function now(): \DateTimeImmutable
    {
        return new \DateTimeImmutable();
    }
}

function debug(Clock $clock): void
{
    var_dump($clock->time());
}
