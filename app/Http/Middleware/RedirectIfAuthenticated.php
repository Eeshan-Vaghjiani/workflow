<?php

namespace App\Http\Middleware;

use App\Providers\RouteServiceProvider;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use App\Models\User;

class RedirectIfAuthenticated
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                $user = Auth::user();

                // Log the authentication info for debugging
                Log::info('RedirectIfAuthenticated middleware', [
                    'path' => $request->path(),
                    'user_id' => $user->id,
                    'is_admin_raw' => $user->is_admin,
                    'is_admin_cast' => (bool)$user->is_admin,
                    'stay_on_home' => $request->cookie('stay_on_home')
                ]);

                // If we're on the homepage and the stay_on_home cookie is set, allow staying
                if ($request->path() === '/' && $request->cookie('stay_on_home') === 'true') {
                    return $next($request);
                }

                // Check if user has 2FA enabled and hasn't verified yet
                if ($user->hasTwoFactorEnabled() && !session('two_factor_authenticated')) {
                    // Store the intended URL based on user role
                    if ((bool)$user->is_admin === true) {
                        session(['url.intended' => route('admin.dashboard')]);
                    } else {
                        session(['url.intended' => route('dashboard')]);
                    }
                    return redirect()->route('two-factor.verify');
                }

                // Redirect based on user role
                if ((bool)$user->is_admin === true) {
                    return redirect()->route('admin.dashboard');
                }

                return redirect()->route('dashboard');
            }
        }

        return $next($request);
    }
}
