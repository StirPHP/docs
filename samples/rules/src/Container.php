<?php

declare(strict_types=1);

namespace App;

class Container
{
    /** @var array<string, object> */
    private array $services = [];

    public function set(object $service): void
    {
        $this->services[$service::class] = $service;
    }

    /** The service of that class. Without the hook, all the checker knows is `object`. */
    public function get(string $id): object
    {
        return $this->services[$id] ?? throw new \RuntimeException("No service $id");
    }
}
