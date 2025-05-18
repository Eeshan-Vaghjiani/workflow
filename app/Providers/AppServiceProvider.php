<?php

namespace App\Providers;

use App\Services\FileService;
use App\Services\AIService;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Event;
use Illuminate\Broadcasting\BroadcastException;

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
        
        // Register AIService
        $this->app->singleton(AIService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Add event listener for broadcast errors
        Event::listen('Illuminate\Broadcasting\BroadcastException', function (BroadcastException $e) {
            Log::error('Broadcasting Exception: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
        });
    }
}
