<?php

namespace App\Providers;

use App\Services\FileService;
use App\Services\AIService;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Event;
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\URL;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Facades\Config;

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
        
        // Configure Sanctum for local development authentication
        $this->configureSanctum();
        
        // Configure session for authentication
        $this->configureSession();
    }
    
    /**
     * Configure Sanctum for SPA authentication
     */
    private function configureSanctum(): void
    {
        // Add all common development domains to stateful domains
        $domains = [
            'localhost',
            'localhost:5173',
            'localhost:5174',
            'localhost:5175',
            'localhost:5176',
            'localhost:5177',
            '127.0.0.1',
            '127.0.0.1:8000',
            '127.0.0.1:5173',
            '127.0.0.1:5174',
            '127.0.0.1:5175',
            '127.0.0.1:5176',
            '127.0.0.1:5177',
            '::1',
        ];
        
        // Get current stateful domains and merge
        $currentDomains = Config::get('sanctum.stateful', []);
        if (is_string($currentDomains)) {
            $currentDomains = explode(',', $currentDomains);
        }
        
        $allDomains = array_unique(array_merge($currentDomains, $domains));
        Config::set('sanctum.stateful', $allDomains);
    }
    
    /**
     * Configure session for authentication
     */
    private function configureSession(): void
    {
        // Set session domain to allow cross-domain cookies
        Config::set('session.domain', '127.0.0.1');
        
        // Set SameSite attribute to lax for local development
        Config::set('session.same_site', 'lax');
        
        // Ensure cookies can be sent in cross-origin requests
        Config::set('cors.supports_credentials', true);
        Config::set('cors.allowed_origins', ['http://127.0.0.1:8000']);
        Config::set('cors.allowed_headers', ['*']);
        Config::set('cors.paths', ['api/*', 'sanctum/csrf-cookie', 'auth/*']);
        
        // Set secure cookie to false for local development
        Config::set('session.secure', false);
    }
}
