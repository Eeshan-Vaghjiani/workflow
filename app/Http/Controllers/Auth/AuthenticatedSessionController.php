<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class your_generic_secretroller extends Controller
{
    /**
     * Show the login page.
     */
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
    public function store(LoginRequest $request): RedirectResponse|JsonResponse|Response
    {
        try {
            $request->authenticate();
            $request->session()->regenerate();

            // Check if this is the user's first login
            if (Auth::check()) {
                $userId = Auth::id();
                $user = User::find($userId);

                if ($user && !$user->last_login_at) {
                    $user->last_login_at = now();
                    $user->save();
                }

                // API requests should still get JSON responses
                if ($request->is('api/*')) {
                    return response()->json([
                        'success' => true,
                        'user' => $user,
                        'csrf_token' => csrf_token(),
                        'session_id' => session()->getId(),
                        'message' => 'Successfully authenticated'
                    ]);
                }
            }

            // For web requests, return a redirect response
            return redirect()->intended(route('dashboard'));
        } catch (ValidationException $e) {
            // For API requests, return JSON error
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'These credentials do not match our records.',
                    'errors' => $e->errors(),
                ], 422);
            }

            // For Inertia requests, return Inertia response with errors
            return Inertia::render('auth/login', [
                'errors' => $e->errors(),
                'canResetPassword' => Route::has('password.request'),
                'status' => $request->session()->get('status'),
            ]);
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
