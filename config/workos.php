<?php

return [
    /*
    |--------------------------------------------------------------------------
    | WorkOS API Key
    |--------------------------------------------------------------------------
    |
    | This value is the API key for your WorkOS account. This is used for
    | authenticating API requests and should be kept secure.
    |
    */
    'api_key' => env('WORKOS_API_KEY'),

    /*
    |--------------------------------------------------------------------------
    | WorkOS Client ID
    |--------------------------------------------------------------------------
    |
    | This value is the client ID for your WorkOS application. This is used for
    | authenticating with the WorkOS API.
    |
    */
    'client_id' => env('WORKOS_CLIENT_ID'),

    /*
    |--------------------------------------------------------------------------
    | WorkOS Redirect URI
    |--------------------------------------------------------------------------
    |
    | This value is the redirect URI for your WorkOS application. This is where
    | users will be redirected after authenticating with WorkOS.
    | Note: Laravel WorkOS package uses the 'authenticate' route as callback
    |
    */
    'redirect_uri' => env('WORKOS_REDIRECT_URI', 'https://app.dhruvinbhudia.me/authenticate'),

    // SSL verification (should be true in production)
    'api_options' => [
        'verify_ssl' => env('WORKOS_VERIFY_SSL', true),
    ],
];
