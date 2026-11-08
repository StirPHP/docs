<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    protected $casts = ['published_at' => 'datetime'];

    public function author()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** @param Builder<Post> $query */
    public function scopePublishedIn(Builder $query, int $year): void
    {
        $query->where('published_at', $year);
    }

    public function getSlugAttribute(): string
    {
        return strtolower(str_replace(' ', '-', $this->title));
    }
}
