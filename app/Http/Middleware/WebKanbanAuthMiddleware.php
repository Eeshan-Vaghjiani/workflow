<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class WebKanbanAuthMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            // Log basic request info
            Log::info('WebKanbanAuthMiddleware: request received', [
                'path' => $request->path(),
                'method' => $request->method(),
                'auth' => Auth::check() ? 'authenticated' : 'not authenticated',
            ]);

            // Focus on web session authentication
            if (Auth::check()) {
                Log::info('WebKanbanAuthMiddleware: authentication successful', [
                    'user_id' => Auth::id(),
                    'username' => Auth::user()->name,
                ]);
                return $next($request);
            }

            // If not authenticated through web session, try request user
            if ($request->user()) {
                Log::info('WebKanbanAuthMiddleware: request user authentication successful', [
                    'user_id' => $request->user()->id,
                    'username' => $request->user()->name,
                ]);
                return $next($request);
            }

            // Log authentication failure with detailed debug info
            Log::warning('WebKanbanAuthMiddleware: web authentication failed', [
                'session_id' => $request->hasSession() ? $request->session()->getId() : null,
                'session_exists' => $request->hasSession(),
                'request_user_exists' => $request->user() ? true : false,
                'cookie_count' => count($request->cookies->all()),
                'csrf_token' => csrf_token(),
            ]);

            // Handle API requests with JSON response
            if ($request->expectsJson() || $request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in again.',
                    'debug_info' => [
                        'web_guard_check' => Auth::check(),
                        'request_user' => $request->user() ? true : false,
                        'has_session' => $request->hasSession(),
                        'is_api' => $request->is('api/*'),
                        'cookies' => count($request->cookies->all()),
                        'headers' => [
                            'accept' => $request->header('Accept'),
                            'x_requested_with' => $request->header('X-Requested-With'),
                        ],
                    ]
                ], 401);
            }

            // Redirect to login for web requests
            return redirect()->guest(route('login'));
        } catch (\Exception $e) {
            // Log the error
            Log::error('WebKanbanAuthMiddleware: Exception caught', [
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
