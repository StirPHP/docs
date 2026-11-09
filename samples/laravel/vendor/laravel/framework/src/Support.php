<?php
// A few of Laravel's classes, written for this example as Laravel's PHPDoc declares them.

namespace Illuminate\Support\Facades {
    abstract class Facade
    {
        public static function __callStatic(string $method, array $args): mixed { return null; }
    }

    class Schema extends Facade
    {
        protected static function getFacadeAccessor() { return 'db.schema'; }
    }

    class Route extends Facade
    {
        protected static function getFacadeAccessor() { return 'router'; }
    }
}

namespace Illuminate\Database\Schema {
    class Blueprint
    {
        public function id(): ColumnDefinition { return new ColumnDefinition(); }
        public function foreignId(string $column): ColumnDefinition { return new ColumnDefinition(); }
        public function string(string $column): ColumnDefinition { return new ColumnDefinition(); }
        public function text(string $column): ColumnDefinition { return new ColumnDefinition(); }
        public function unsignedInteger(string $column): ColumnDefinition { return new ColumnDefinition(); }
        public function timestamp(string $column): ColumnDefinition { return new ColumnDefinition(); }
        public function timestamps(): void {}
    }

    class ColumnDefinition
    {
        public function nullable(): static { return $this; }
    }

    class Builder
    {
        public function create(string $table, \Closure $callback): void {}
    }
}

namespace Illuminate\Routing {
    class Router
    {
        public function get(string $uri, array|string|callable $action): Route { return new Route(); }
    }

    class Route
    {
        public function name(string $name): static { return $this; }
    }
}

namespace Illuminate\Contracts\Auth {
    interface Authenticatable {}

    interface Factory
    {
        public function guard(?string $name = null): Guard;
    }

    interface Guard
    {
        /** @return Authenticatable|null */
        public function user();
    }
}

namespace Illuminate\Auth {
    /** @mixin \Illuminate\Contracts\Auth\Guard */
    class AuthManager implements \Illuminate\Contracts\Auth\Factory
    {
        public function guard(?string $name = null): \Illuminate\Contracts\Auth\Guard { return new SessionGuard(); }
        public function __call(string $method, array $parameters): mixed { return null; }
    }

    class SessionGuard implements \Illuminate\Contracts\Auth\Guard
    {
        public function user() { return null; }
    }
}

namespace Illuminate\Contracts\View {
    interface View {}
}

namespace Illuminate\View {
    abstract class Component
    {
        abstract public function render();
    }
}

namespace {
    function auth(): \Illuminate\Contracts\Auth\Factory { return new \Illuminate\Auth\AuthManager(); }
    function env(string $key, mixed $default = null): mixed { return $default; }
    function view(string $view, array $data = []): \Illuminate\Contracts\View\View { throw new \LogicException(); }
    function route(string $name, array $parameters = []): string { return ''; }
}
