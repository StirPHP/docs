{{-- $posts comes from PostController::index. Hover over it. --}}
<x-layout :title="'Posts of ' . $year">
    <ul>
        @forelse ($posts as $post)
            <li @class(['popular' => $post->views > 1000])>
                <a href="{{ route('posts.show', ['id' => $post->id]) }}">{{ $post->title }}</a>
                by {{ $post->author->name }}
                <x-view-count :count="$post->views" label="reads" />
                <button @click="share('{{ $post->slug }}')">Share</button>
            </li>
        @empty
            <li>Nothing from {{ $yaer }} yet.</li>
        @endforelse
    </ul>

    @include('posts.footer', ['total' => $posts->count()])
</x-layout>
