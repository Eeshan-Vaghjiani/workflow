<?php

namespace App\Providers;

use App\Services\FileService;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Use Laravel's built-in Filesystem implementation for core bindings
        $this->app->singleton('files', function () {
            return new Filesystem;
        });

        $this->app->singleton('filesystem', function ($app) {
            return $app['files'];
        });

        // Register custom FileService for when you explicitly want to use it
        $this->app->singleton(FileService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
