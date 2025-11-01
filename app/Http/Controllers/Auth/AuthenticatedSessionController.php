<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{

    public function create(Request $request): Response
    {
        if (Auth::check()) {
            return redirect()->intended(route('dashboard'))->toResponse($request);
        }

        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request)
    {
        try {
            // Log request headers for debugging
            Log::debug('Login Request Headers', [
                'headers' => $request->headers->all(),
                'has_csrf' => $request->hasHeader('X-CSRF-TOKEN'),
                'csrf_token' => $request->header('X-CSRF-TOKEN'),
                'session_token' => session()->token(),
                'matches' => $request->header('X-CSRF-TOKEN') === session()->token(),
                'accepts_json' => $request->expectsJson()
            ]);

            $request->authenticate();
            $request->session()->regenerate();

            // Check if this is the user's first login
            $user = Auth::user();
            if (!$user->last_login_at) {
                $user->last_login_at = now();
                $user->save();
            }

            // Add debug logging for user role
            Log::info('User authenticated', [
                'user_id' => $user->id,
                'is_admin_raw' => $user->is_admin,
                'is_admin_cast' => (bool)$user->is_admin,
                'is_admin_method' => $user->isAdmin(),
            ]);

            // Return JSON response ONLY for API requests, not for Inertia requests
            if (($request->expectsJson() || $request->is('api/*')) && !$request->header('X-Inertia')) {
                return response()->json([
                    'success' => true,
                    'user' => $user,
                    'csrf_token' => csrf_token(),
                    'session_id' => session()->getId(),
                    'message' => 'Successfully authenticated'
                ]);
            }

            // Check if user has 2FA enabled
            if ($user->hasTwoFactorEnabled() && !session('two_factor_authenticated')) {
                // Store the intended URL based on user role
                if ((bool)$user->is_admin === true) {
                    session(['url.intended' => route('admin.dashboard')]);
                } else {
                    session(['url.intended' => route('dashboard')]);
                }
                return redirect()->route('two-factor.verify');
            }

            // If no 2FA or already verified, redirect based on role
            if ((bool)$user->is_admin === true) {
                return redirect()->intended(route('admin.dashboard'));
            }

            // For regular users, redirect to dashboard
            return redirect()->intended(route('dashboard'));
        } catch (\Exception $e) {
            Log::error('Login Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Return JSON error for API requests
            if (($request->expectsJson() || $request->is('api/*')) && !$request->header('X-Inertia')) {
                return response()->json([
                    'success' => false,
                    'message' => 'The provided credentials do not match our records.',
                    'error' => $e->getMessage()
                ], 401);
            }

            if ($request->header('X-Inertia')) {
                return Inertia::render('auth/login', [
                    'errors' => [
                        'email' => 'The provided credentials do not match our records.',
                    ],
                ]);
            }

            return redirect()->back()->withErrors([
                'email' => 'The provided credentials do not match our records.',
            ])->withInput();
        }
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
