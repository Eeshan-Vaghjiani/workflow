<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\WorkOS\WorkOS;
use App\Http\Helpers\WorkOSCurlClient;
use WorkOS\WorkOS as WorkOSClient;

class WorkOSServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Override the Laravel\WorkOS\WorkOS configuration
        $this->app->extend('workos', function ($workos, $app) {
            // For local development, disable SSL verification
            if (app()->environment('local')) {
                // Set PHP cURL options globally for this request
                ini_set('curl.cainfo', '');
                putenv('CURL_CA_BUNDLE=');
            }

            return $workos;
        });

        // Override the WorkOS\WorkOS client
        $this->app->singleton(WorkOSClient::class, function ($app) {
            // Create a WorkOS client with our custom cURL client
            $workos = new WorkOSClient(config('services.workos.secret'));

            // Only in local environment
            if (app()->environment('local')) {
                // Replace the request client with our custom one
                $workos->setRequestClient(new WorkOSCurlClient());
            }

            return $workos;
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
