<h1>{{ $post->titel }}</h1>
<p>{{ $subtitle }}</p>
<p @class(['long' => strlen($post->title, 2) > 40])>{{ $post->title }}</p>

<x-view-count :max-views="$post" />
<x-view-count max-views="12" data-id="a" ::class="$forAlpine">
    <x-slot:label>{{ $post->title }}</x-slot:label>
</x-view-count>
<x-no-such-component :a="$post->views" />

<button @click="open()">you@example.com</button>
