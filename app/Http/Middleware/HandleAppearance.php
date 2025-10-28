<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

class HandleAppearance
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get the appearance setting from cookie or default to system
        $appearance = $request->cookie('appearance') ?? 'system';

        // Share the appearance value with all views
        View::share('appearance', $appearance);

        // For system preference, try to detect if user prefers dark mode
        if ($appearance === 'system') {
            // Default to false (light mode) unless we can detect dark mode preference
            $prefersDark = false;

            // Check for prefers-color-scheme in the Accept header (some browsers include this)
            $acceptHeader = $request->header('Accept');
            if (str_contains($acceptHeader, 'prefers-color-scheme=dark')) {
                $prefersDark = true;
            }

            // Check user agent for mobile devices that might indicate dark mode
            $userAgent = $request->header('User-Agent');
            if (str_contains(strtolower($userAgent), 'dark mode')) {
                $prefersDark = true;
            }

            View::share('system_prefers_dark', $prefersDark);
        }

        return $next($request);
    }
}
