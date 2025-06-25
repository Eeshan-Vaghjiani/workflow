<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Log access attempt
        Log::info('AdminMiddleware - checking access', [
            'is_authenticated' => Auth::check(),
            'user_id' => Auth::check() ? Auth::id() : null,
            'path' => $request->path(),
        ]);

        // Check if user is authenticated and is an admin
        if (!Auth::check()) {
            Log::warning('AdminMiddleware - access denied (not authenticated)');

            if ($request->expectsJson()) {
                return response()->json(['error' => 'Unauthorized. Admin access required.'], 403);
            }
            return redirect()->route('login')->with('error', 'You must be logged in to access the admin area.');
        }

        $user = Auth::user();
        $isAdmin = (bool)$user->is_admin;

        Log::info('AdminMiddleware - admin check', [
            'user_id' => $user->id,
            'email' => $user->email,
            'is_admin_raw' => $user->is_admin,
            'is_admin_cast' => $isAdmin,
        ]);

        if (!$isAdmin) {
            Log::warning('AdminMiddleware - access denied (not admin)');

            if ($request->expectsJson()) {
                return response()->json(['error' => 'Unauthorized. Admin access required.'], 403);
            }
            return redirect()->route('dashboard')->with('error', 'You do not have permission to access the admin area.');
        }

        Log::info('AdminMiddleware - access granted');
        return $next($request);
    }
}
