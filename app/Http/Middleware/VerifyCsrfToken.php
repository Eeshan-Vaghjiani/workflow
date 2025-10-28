<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        // Temporarily exempt broadcasting auth routes for debugging
        'broadcasting/auth',
        'api/broadcasting/auth',
        // Temporarily exclude login route to debug CSRF issues
        'login',
        // Exclude WorkOS authentication callback
        'authenticate',
        'workos-callback',
        // Temporarily exclude study planner routes to debug authentication issues
        'study-sessions',
        'study-tasks',
        'api/web/study-sessions',
        'api/web/study-tasks',
        // Temporarily exclude message API routes for debugging
        'api/messages/*',
        'api/messages'
    ];

    /**
     * Determine if the request has a URI that should pass through CSRF verification.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return bool
     */
    protected function inExceptArray($request)
    {
        // Check if the request has been marked to skip CSRF by our custom middleware
        if ($request->attributes->has('skip-csrf') && $request->attributes->get('skip-csrf') === true) {
            Log::info('Skipping CSRF verification due to skip-csrf attribute', [
                'path' => $request->path(),
                'session_id' => session()->getId(),
            ]);
            return true;
        }

        return parent::inExceptArray($request);
    }
}
