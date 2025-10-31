<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        {{-- Force light mode for now - dark mode detection disabled --}}
        <script>
            // Ensure light mode is always active
            document.documentElement.classList.remove('dark');
        </script>

        {{-- Inline fallback background color --}}
        <style>
            html {
                background-color: #ffffff;
            }
            html.dark {
                background-color: #0a0a0a;
            }
            body {
                background-color: #ffffff;
                color: #1b1b18;
            }
            html.dark body {
                background-color: #0a0a0a;
                color: #ededec;
            }
        </style>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        {{-- Inertia & Vite --}}
        @routes
        @viteReactRefresh
        @vite('resources/js/app.tsx')
        @inertiaHead
    </head>

    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
