<?php

return [
    /*
    |--------------------------------------------------------------------------
    | OpenRouter Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains the configuration for the OpenRouter API.
    |
    */

    'api_key' => env('OPENROUTER_API_KEY', 'sk-or-v1-1234567890abcdef1234567890abcdef'),

    'model' => env('OPENROUTER_MODEL', 'deepseek/deepseek-v3-base:free'),

    'verify_ssl' => env('OPENROUTER_VERIFY_SSL', false),
];
