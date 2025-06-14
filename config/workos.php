<?php

return [
    /*
    |--------------------------------------------------------------------------
    | WorkOS Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for WorkOS integration.
    |
    */

    'client_id' => env('WORKOS_CLIENT_ID'),
    'api_key' => env('WORKOS_API_KEY'),
    'redirect_url' => env('WORKOS_REDIRECT_URL', 'http://127.0.0.1:8000/authenticate'),

    // Disable SSL verification for local development only
    'api_options' => [
        'verify_ssl' => env('WORKOS_VERIFY_SSL', false),
    ],
];
