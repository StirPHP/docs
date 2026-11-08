<?php

namespace App;

final class Mailer
{
    public function send(string $to): bool
    {
        return true;
    }
}

class Container
{
    public function get(string $id): object
    {
        return new $id();
    }
}

class Model
{
    public function __get(string $name): mixed
    {
        return null;
    }

    /** @param list<mixed> $arguments */
    public static function __callStatic(string $name, array $arguments): mixed
    {
        return null;
    }
}

final class User extends Model {}

/** @template T of Model */
final class Query
{
    /** @param list<mixed> $arguments */
    public function __call(string $name, array $arguments): mixed
    {
        return $this;
    }

    /** @return list<T> */
    public function get(): array
    {
        return [];
    }
}

/** @template T of object */
final class Proxy
{
    public function __get(string $name): mixed
    {
        return null;
    }
}

function main(Container $container): void
{
    $sent = $container->get(Mailer::class)->send('ana@example.com');
    $container->get(Mailer::class)->sned('ana@example.com');

    $user = User::find(1);
    $id = $user?->id;
    $user?->name;

    /** @var Query<User> $query */
    $query = new Query();
    $users = $query->whereEmail('ana@example.com')->get();

    var_dump($sent, $id, $users);
}
