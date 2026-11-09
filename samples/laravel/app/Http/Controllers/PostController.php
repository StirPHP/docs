<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Contracts\View\View;

final class PostController
{
    public function index(): View
    {
        $year = 2025;
        $posts = Post::publishedIn('2025')->orderBy('views')->get();

        return view('posts.index', compact('posts', 'year'));
    }

    public function show(int $id): string
    {
        $post = Post::where('id', $id)->first();
        if ($post === null) {
            return 'Not found';
        }

        return $post->title . ' by ' . $post->author->name . ', ' . $this->views($post->views);
    }

    public function mine(): int
    {
        $user = auth()->user();

        return $user->posts()->count() + $user->posts->count();
    }

    private function views(string $views): string
    {
        return $views . ' views';
    }
}
