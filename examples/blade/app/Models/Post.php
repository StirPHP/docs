<?php

declare(strict_types=1);

namespace App\Models;

final class Post
{
    public function __construct(public string $title, public int $views) {}
}
