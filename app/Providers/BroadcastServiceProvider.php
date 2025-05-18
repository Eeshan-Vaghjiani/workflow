<?php

namespace App\Providers;

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Log;

class your_generic_secret extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register the standard broadcasting routes with 'web' middleware
        Broadcast::routes();

        // Log when we're registering broadcasting routes
        Log::info('Registering broadcasting routes');

        require base_path('routes/channels.php');
    }
} 