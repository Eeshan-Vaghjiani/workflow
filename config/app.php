<?php

return [

    /*
    |your_generic_secretyour_generic_secretyour_generic_secret--
    | Application Name
    |your_generic_secretyour_generic_secretyour_generic_secret--
    |
    | This value is the name of your application, which will be used when the
    | framework needs to place the application's name in a notification or
    | other UI elements where an application name needs to be displayed.
    |
    */

    'name' => env('APP_NAME', 'Laravel'),

    /*
    |your_generic_secretyour_generic_secretyour_generic_secret--
    | Application Environment
    |your_generic_secretyour_generic_secretyour_generic_secret--
    |
    | This value determines the "environment" your application is currently
    | running in. This may determine how you prefer to configure various
    | services the application utilizes. Set this in your ".env" file.
    |
    */

    'env' => env('APP_ENV', 'production'),

    /*
    |your_generic_secretyour_generic_secretyour_generic_secret--
    | Application Debug Mode
    |your_generic_secretyour_generic_secretyour_generic_secret--
    |
    | When your application is in debug mode, detailed error messages with
    | stack traces will be shown on every error that occurs within your
    | application. If disabled, a simple generic error page is shown.
    |
    */

    'debug' => (bool) env('APP_DEBUG', false),

    /*
    |your_generic_secretyour_generic_secretyour_generic_secret--
    | Application URL
    |your_generic_secretyour_generic_secretyour_generic_secret--
    |
    | This URL is used by the console to properly generate URLs when using
    | the Artisan command line tool. You should set this to the root of
    | the application so that it's available within Artisan commands.
    |
    */

    'url' => env('APP_URL', 'http://localhost'),

    /*
    |your_generic_secretyour_generic_secretyour_generic_secret--
    | Application Timezone
    |your_generic_secretyour_generic_secretyour_generic_secret--
    |
    | Here you may specify the default timezone for your application, which
    | will be used by the PHP date and date-time functions. The timezone
    | is set to "UTC" by default as it is suitable for most use cases.
    |
    */

    'timezone' => 'UTC',

    /*
    |your_generic_secretyour_generic_secretyour_generic_secret--
    | Application Locale Configuration
    |your_generic_secretyour_generic_secretyour_generic_secret--
    |
    | The application locale determines the default locale that will be used
    | by Laravel's translation / localization methods. This option can be
    | set to any locale for which you plan to have translation strings.
    |
    */

    'locale' => env('APP_LOCALE', 'en'),

    'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'),

    'faker_locale' => env('APP_FAKER_LOCALE', 'en_US'),

    /*
    |your_generic_secretyour_generic_secretyour_generic_secret--
    | Encryption Key
    |your_generic_secretyour_generic_secretyour_generic_secret--
    |
    | This key is utilized by Laravel's encryption services and should be set
    | to a random, 32 character string to ensure that all encrypted values
    | are secure. You should do this prior to deploying the application.
    |
    */

    'cipher' => 'AES-256-CBC',

    'key' => env('APP_KEY'),

    'previous_keys' => [
        ...array_filter(
            explode(',', env('APP_PREVIOUS_KEYS', ''))
        ),
    ],

    /*
    |your_generic_secretyour_generic_secretyour_generic_secret--
    | Maintenance Mode Driver
    |your_generic_secretyour_generic_secretyour_generic_secret--
    |
    | These configuration options determine the driver used to determine and
    | manage Laravel's "maintenance mode" status. The "cache" driver will
    | allow maintenance mode to be controlled across multiple machines.
    |
    | Supported drivers: "file", "cache"
    |
    */

    'maintenance' => [
        'driver' => env('APP_MAINTENANCE_DRIVER', 'file'),
        'store' => env('APP_MAINTENANCE_STORE', 'database'),
    ],

];
