<?php
// A few of Laravel's declarations, written for this example.

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
    function view(string $view, array $data = []): \Illuminate\Contracts\View\View { throw new \LogicException(); }
}
