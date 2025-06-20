<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use WorkOS\WorkOS;

class WorkOSServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Set global SSL certificate path for PHP cURL
        $certPath = base_path('vendor/composer/cacert.pem');
        if (file_exists($certPath)) {
            ini_set('curl.cainfo', $certPath);
        }

        $this->app->singleton(WorkOS::class, function ($app) {
            return new WorkOS(config('workos.api_key'));
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
