<ul>
@foreach ($posts as $post)
    <li><a href="{{ route('posts.show', ['id' => $post->id]) }}">{{ $post->title }}</a></li>
@endforeach
</ul>
