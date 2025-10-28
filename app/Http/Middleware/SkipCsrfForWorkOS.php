<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class SkipCsrfForWorkOS
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Log the request
        Log::info('SkipCsrfForWorkOS middleware executed', [
            'path' => $request->path(),
            'has_code' => $request->has('code'),
            'session_id' => session()->getId(),
        ]);

        // If this is a WorkOS callback with a code parameter, skip CSRF verification
        if ($request->has('code') && in_array($request->path(), ['authenticate', 'workos-callback'])) {
            $request->attributes->set('skip-csrf', true);
            Log::info('Skipping CSRF for WorkOS callback', [
                'path' => $request->path(),
                'code' => $request->code,
            ]);
        }

        return $next($request);
    }
}
