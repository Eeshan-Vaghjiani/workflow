<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class TwoFactorAuthenticationMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip 2FA check for the verification routes themselves
        if ($request->routeIs('two-factor.*')) {
            return $next($request);
        }

        // Log that middleware is being executed
        Log::info('TwoFactorAuthenticationMiddleware executed', [
            'route' => $request->route()->getName(),
            'path' => $request->path()
        ]);

        $user = Auth::user();

        if (!$user) {
            return $next($request);
        }

        Log::info('User is authenticated', [
            'user_id' => $user->id,
            'email' => $user->email,
            'session_id' => Session::getId(),
            'has_2fa_session' => Session::has('two_factor_authenticated')
        ]);

        try {
            // Check if user has 2FA enabled by checking the confirmed_at timestamp
            $has2fa = !is_null($user->two_factor_confirmed_at);

            // Log detailed information about the 2FA status
            Log::info('2FA check result', [
                'user_id' => $user->id,
                'has_2fa' => $has2fa,
                'two_factor_confirmed_at' => $user->two_factor_confirmed_at,
                'session_has_2fa' => Session::has('two_factor_authenticated')
            ]);

            // Only redirect to 2FA verification if:
            // 1. User has 2FA enabled
            // 2. The session hasn't been verified yet
            if ($has2fa && !Session::has('two_factor_authenticated')) {
                Log::info('Redirecting to 2FA verification', [
                    'user_id' => $user->id,
                    'has_2fa' => $has2fa,
                    'route' => $request->route()->getName()
                ]);

                // Store the intended URL to redirect back after 2FA verification
                Session::put('url.intended', $request->url());

                // Redirect to the 2FA verification page
                return redirect()->route('two-factor.verify');
            }
        } catch (\Exception $e) {
            Log::error('Error in 2FA middleware', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $user->id ?? 'unknown'
            ]);
        }

        // Continue to the next middleware
        return $next($request);
    }
}
