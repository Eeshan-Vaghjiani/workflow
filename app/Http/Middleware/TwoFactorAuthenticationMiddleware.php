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
        // Log that middleware is being executed
        Log::info('TwoFactorAuthenticationMiddleware executed');

        $user = Auth::user();

        if ($user) {
            Log::info('User is authenticated', ['user_id' => $user->id]);

            try {
                // Check if method exists before calling it
                if (method_exists($user, 'hasTwoFactorEnabled')) {
                    $has2fa = $user->hasTwoFactorEnabled();
                    Log::info('hasTwoFactorEnabled result', ['has_2fa' => $has2fa]);

                    if ($has2fa && !Session::has('two_factor_authenticated')) {
                        Log::info('Redirecting to 2FA verification');
                        // Store the intended URL to redirect back after 2FA verification
                        Session::put('url.intended', $request->url());

                        // Redirect to the 2FA verification page
                        return redirect()->route('two-factor.verify');
                    }
                } else {
                    Log::warning('hasTwoFactorEnabled method does not exist on user model');
                }
            } catch (\Exception $e) {
                Log::error('Error in 2FA middleware', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }

        // For now, always continue to the next middleware
        return $next($request);
    }
}
