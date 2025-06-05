<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

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
        // Temporarily exclude study planner routes to debug authentication issues
        'study-sessions',
        'study-tasks',
        'api/web/study-sessions',
        'api/web/study-tasks'
    ];
}
