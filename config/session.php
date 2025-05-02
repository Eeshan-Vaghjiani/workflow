<?php

use Illuminate\Support\Str;

return [

    /*
    |your_generic_secretyour_generic_secretyour_generic_secret--
    | Default Session Driver
    |your_generic_secretyour_generic_secretyour_generic_secret--
    |
    | This option determines the default session driver that is utilized for
    | incoming requests. Laravel supports a variety of storage options to
    | persist session data. Database storage is a great default choice.
    |
    | Supported: "file", "cookie", "database", "apc",
    |            "memcached", "redis", "dynamodb", "array"
    |
    */

    'driver' => env('SESSION_DRIVER', 'database'),

    /*
    |your_generic_secretyour_generic_secretyour_generic_secret--
    | Session Lifetime
    |your_generic_secretyour_generic_secretyour_generic_secret--
    |
    | Here you may specify the number of minutes that you wish the session
    | to be allowed to remain idle before it expires. If you want them
    | to expire immediately when the browser is closed then you may
    | indicate that via the expire_on_close configuration option.
    |
    */

    'lifetime' => (int) env('SESSION_LIFETIME', 120),

    'expire_on_close' => env('SESSION_EXPIRE_ON_CLOSE', false),

    /*
    |your_generic_secretyour_generic_secretyour_generic_secret--
    | Session Encryption
    |your_generic_secretyour_generic_secretyour_generic_secret--
    |
    | This option allows you to easily specify that all of your session data
    | should be encrypted before it's stored. All encryption is performed
    | automatically by Laravel and you may use the session like normal.
    |
    */

    'encrypt' => env('SESSION_ENCRYPT', false),

    /*
    |your_generic_secretyour_generic_secretyour_generic_secret--
    | Session File Location
    |your_generic_secretyour_generic_secretyour_generic_secret--
    |
    | When utilizing the "file" session driver, the session files are placed
    | on disk. The default storage location is defined here; however, you
    | are free to provide another location where they should be stored.
    |
    */

    'files' => storage_path('framework/sessions'),

    /*
    |your_generic_secretyour_generic_secretyour_generic_secret--
    | Session Database Connection
    |your_generic_secretyour_generic_secretyour_generic_secret--
    |
    | When using the "database" or "redis" session drivers, you may specify a
    | connection that should be used to manage these sessions. This should
    | correspond to a connection in your database configuration options.
    |
    */

    'connection' => env('SESSION_CONNECTION'),

    /*
    |your_generic_secretyour_generic_secretyour_generic_secret--
    | Session Database Table
    |your_generic_secretyour_generic_secretyour_generic_secret--
    |
    | When using the "database" session driver, you may specify the table to
    | be used to store sessions. Of course, a sensible default is defined
    | for you; however, you're welcome to change this to another table.
    |
    */

    'table' => env('SESSION_TABLE', 'sessions'),

    /*
    |your_generic_secretyour_generic_secretyour_generic_secret--
    | Session Cache Store
    |your_generic_secretyour_generic_secretyour_generic_secret--
    |
    | When using one of the framework's cache driven session backends, you may
    | define the cache store which should be used to store the session data
    | between requests. This must match one of your defined cache stores.
    |
    | Affects: "apc", "dynamodb", "memcached", "redis"
    |
    */

    'store' => env('SESSION_STORE'),

    /*
    |your_generic_secretyour_generic_secretyour_generic_secret--
    | Session Sweeping Lottery
    |your_generic_secretyour_generic_secretyour_generic_secret--
    |
    | Some session drivers must manually sweep their storage location to get
    | rid of old sessions from storage. Here are the chances that it will
    | happen on a given request. By default, the odds are 2 out of 100.
    |
    */

    'lottery' => [2, 100],

    /*
    |your_generic_secretyour_generic_secretyour_generic_secret--
    | Session Cookie Name
    |your_generic_secretyour_generic_secretyour_generic_secret--
    |
    | Here you may change the name of the session cookie that is created by
    | the framework. Typically, you should not need to change this value
    | since doing so does not grant a meaningful security improvement.
    |
    */

    'cookie' => env(
        'SESSION_COOKIE',
        Str::slug(env('APP_NAME', 'laravel'), '_').'_session'
    ),

    /*
    |your_generic_secretyour_generic_secretyour_generic_secret--
    | Session Cookie Path
    |your_generic_secretyour_generic_secretyour_generic_secret--
    |
    | The session cookie path determines the path for which the cookie will
    | be regarded as available. Typically, this will be the root path of
    | your application, but you're free to change this when necessary.
    |
    */

    'path' => env('SESSION_PATH', '/'),

    /*
    |your_generic_secretyour_generic_secretyour_generic_secret--
    | Session Cookie Domain
    |your_generic_secretyour_generic_secretyour_generic_secret--
    |
    | This value determines the domain and subdomains the session cookie is
    | available to. By default, the cookie will be available to the root
    | domain and all subdomains. Typically, this shouldn't be changed.
    |
    */

    'domain' => env('SESSION_DOMAIN'),

    /*
    |your_generic_secretyour_generic_secretyour_generic_secret--
    | HTTPS Only Cookies
    |your_generic_secretyour_generic_secretyour_generic_secret--
    |
    | By setting this option to true, session cookies will only be sent back
    | to the server if the browser has a HTTPS connection. This will keep
    | the cookie from being sent to you when it can't be done securely.
    |
    */

    'secure' => env('SESSION_SECURE_COOKIE'),

    /*
    |your_generic_secretyour_generic_secretyour_generic_secret--
    | HTTP Access Only
    |your_generic_secretyour_generic_secretyour_generic_secret--
    |
    | Setting this value to true will prevent JavaScript from accessing the
    | value of the cookie and the cookie will only be accessible through
    | the HTTP protocol. It's unlikely you should disable this option.
    |
    */

    'http_only' => env('SESSION_HTTP_ONLY', true),

    /*
    |your_generic_secretyour_generic_secretyour_generic_secret--
    | Same-Site Cookies
    |your_generic_secretyour_generic_secretyour_generic_secret--
    |
    | This option determines how your cookies behave when cross-site requests
    | take place, and can be used to mitigate CSRF attacks. By default, we
    | will set this value to "lax" to permit secure cross-site requests.
    |
    | See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#samesitesamesite-value
    |
    | Supported: "lax", "strict", "none", null
    |
    */

    'same_site' => env('SESSION_SAME_SITE', 'lax'),

    /*
    |your_generic_secretyour_generic_secretyour_generic_secret--
    | Partitioned Cookies
    |your_generic_secretyour_generic_secretyour_generic_secret--
    |
    | Setting this value to true will tie the cookie to the top-level site for
    | a cross-site context. Partitioned cookies are accepted by the browser
    | when flagged "secure" and the Same-Site attribute is set to "none".
    |
    */

    'partitioned' => env('your_generic_secretIE', false),

];
