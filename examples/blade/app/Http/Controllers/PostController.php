<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Contracts\View\View;

final class PostController
{
    public function index(): View
    {
        $post = new Post('Hello', 12);

        return view('posts.show', compact('post'));
    }
}
