<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class KanbanAuthMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        try {
            // Log basic request info
            Log::info('KanbanAuthMiddleware: request received', [
                'path' => $request->path(),
                'method' => $request->method(),
                'auth' => Auth::check() ? 'authenticated' : 'not authenticated',
            ]);

            // First try the web session authentication (most reliable)
            if (Auth::check()) {
                Log::info('KanbanAuthMiddleware: web auth check passed', [
                    'user_id' => Auth::id(),
                    'user_name' => Auth::user()->name,
                ]);
                return $next($request);
            }

            // Then try the request user (might be set by other middleware)
            if ($request->user()) {
                Log::info('KanbanAuthMiddleware: request user check passed', [
                    'user_id' => $request->user()->id,
                    'user_name' => $request->user()->name,
                ]);
                return $next($request);
            }

            // Try specific web guard
            if (Auth::guard('web')->check()) {
                Log::info('KanbanAuthMiddleware: web guard check passed', [
                    'user_id' => Auth::guard('web')->id(),
                ]);
                return $next($request);
            }

            // Try sanctum guard if available
            if (class_exists('\Laravel\Sanctum\Guard') && Auth::guard('sanctum')->check()) {
                Log::info('KanbanAuthMiddleware: sanctum guard check passed', [
                    'user_id' => Auth::guard('sanctum')->id(),
                ]);
                return $next($request);
            }

            // Authentication failed - log detailed debug info
            Log::warning('KanbanAuthMiddleware: authentication failed', [
                'path' => $request->path(),
                'session_id' => $request->hasSession() ? $request->session()->getId() : null,
                'cookies' => count($request->cookies->all()),
                'has_bearer_token' => $request->bearerToken() ? true : false,
                'has_token_cookie' => $request->cookies->has('XSRF-TOKEN'),
                'has_session_cookie' => $request->cookies->has('laravel_session'),
                'headers' => [
                    'accept' => $request->header('Accept'),
                    'content_type' => $request->header('Content-Type'),
                    'x_requested_with' => $request->header('X-Requested-With'),
                    'authorization' => $request->header('Authorization') ? 'Present' : 'Missing',
                ],
            ]);

            // For API requests, return JSON response
            if ($request->expectsJson() || $request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in again.',
                    'debug_info' => [
                        'auth_check' => Auth::check(),
                        'web_guard_check' => Auth::guard('web')->check(),
                        'sanctum_check' => class_exists('\Laravel\Sanctum\Guard') ? Auth::guard('sanctum')->check() : 'guard_not_available',
                        'request_user' => $request->user() ? true : false,
                    ]
                ], 401);
            }

            // For web requests, redirect to login
            return redirect()->guest(route('login'));
        } catch (\Exception $e) {
            // Log the error
            Log::error('KanbanAuthMiddleware: Exception caught', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            
            // Return a JSON response for API requests
            if ($request->expectsJson() || $request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                return response()->json([
                    'message' => 'Authentication error',
                    'error' => $e->getMessage(),
                ], 500);
            }
            
            // Redirect to login for web requests
            return redirect()->guest(route('login'))->with('error', 'Authentication error: ' . $e->getMessage());
        }
    }
}
