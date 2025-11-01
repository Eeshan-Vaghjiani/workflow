<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class HandleWorkOSAuth
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Log the authentication attempt
        Log::info('WorkOS Auth Request', [
            'path' => $request->path(),
            'method' => $request->method(),
            'query' => $request->query(),
            'has_code' => $request->has('code'),
            'session_id' => session()->getId(),
        ]);

        // Check if this is a WorkOS callback with a code
        if ($request->path() === 'authenticate' && $request->has('code')) {
            // Add the CSRF token to the request
            $request->headers->set('X-CSRF-TOKEN', csrf_token());

            // Log that we've added the CSRF token
            Log::info('Added CSRF token to WorkOS auth request', [
                'token' => csrf_token(),
                'session_id' => session()->getId(),
            ]);
        }

        return $next($request);
    }
}
