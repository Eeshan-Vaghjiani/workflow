<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;

class AuthDebugController extends Controller
{
    /**
     * Show auth debug page
     */
    public function showAuthDebug()
    {
        return view('debug.auth-test');
    }

    /**
     * Get detailed authentication status
     */
    public function getAuthStatus(Request $request)
    {
        try {
            $user = Auth::user();

            $authInfo = [
                'authenticated' => Auth::check(),
                'user_id' => Auth::id(),
                'guards' => [
                    'web' => Auth::guard('web')->check(),
                    'api' => Auth::guard('api')->check(),
                    'sanctum' => Auth::guard('sanctum')->check(),
                ],
                'request_user' => $request->user() ? true : false,
                'session' => [
                    'has_session' => $request->hasSession(),
                    'session_id' => $request->hasSession() ? $request->session()->getId() : null,
                    'token_exists' => $request->hasSession() ? $request->session()->has('_token') : null,
                ],
                'cookies' => [
                    'count' => count($request->cookies->all()),
                    'names' => array_keys($request->cookies->all()),
                    'has_laravel_session' => $request->cookies->has('laravel_session'),
                    'has_xsrf_token' => $request->cookies->has('XSRF-TOKEN'),
                ],
                'headers' => [
                    'user_agent' => $request->header('User-Agent'),
                    'accept' => $request->header('Accept'),
                    'content_type' => $request->header('Content-Type'),
                    'x_requested_with' => $request->header('X-Requested-With'),
                    'referer' => $request->header('Referer'),
                ],
                'method' => $request->method(),
                'path' => $request->path(),
                'url' => $request->url(),
                'is_api' => $request->is('api/*'),
                'is_web' => $request->is('web/*'),
                'is_ajax' => $request->ajax(),
                'wants_json' => $request->wantsJson(),
            ];

            if ($user) {
                $authInfo['user'] = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'created_at' => $user->created_at->format('Y-m-d H:i:s'),
                    'is_admin' => (bool)$user->is_admin,
                ];
            }

            // Log the full auth status
            Log::info('Auth Debug: Full Auth Status', $authInfo);

            return response()->json($authInfo);
        } catch (\Exception $e) {
            Log::error('Auth Debug Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            // Return a simplified response that won't cause errors
            return response()->json([
                'authenticated' => Auth::check(),
                'user_id' => Auth::id(),
                'error' => 'Error retrieving full auth details: ' . $e->getMessage(),
                'user' => Auth::check() ? [
                    'id' => Auth::id(),
                    'is_admin' => Auth::user() ? (bool)Auth::user()->is_admin : false
                ] : null
            ]);
        }
    }

    /**
     * Refresh authentication
     */
    public function refreshAuth(Request $request)
    {
        try {
            // Force Laravel to re-authenticate the user
            if (Auth::check()) {
                Auth::loginUsingId(Auth::id());
                
                return response()->json([
                    'success' => true,
                    'message' => 'Authentication refreshed',
                    'user_id' => Auth::id()
                ]);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Not authenticated',
                'authenticated' => false
            ], 401);
        } catch (\Exception $e) {
            Log::error('Auth Refresh Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to refresh authentication: ' . $e->getMessage(),
                'authenticated' => Auth::check()
            ], 500);
        }
    }
}
