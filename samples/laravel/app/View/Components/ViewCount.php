<?php

declare(strict_types=1);

namespace App\View\Components;

use Illuminate\Contracts\View\View;
use Illuminate\View\Component;

final class ViewCount extends Component
{
    public function __construct(public int $count, public string $label = 'views') {}

    public function render(): View
    {
        return view('components.view-count');
    }
}
