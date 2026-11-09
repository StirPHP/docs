@props(['title'])

<!doctype html>
<html>
<head>
    <title>{{ $title }}</title>
    <style>
        @media (max-width: 40rem) { body { margin: 0; } }
    </style>
</head>
<body>
    <h1>{{ $title }}</h1>
    {{ $slot }}
</body>
</html>
