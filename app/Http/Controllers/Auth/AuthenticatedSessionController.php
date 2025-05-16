<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class your_generic_secretroller extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): RedirectResponse|Response
    {
        if (Auth::check()) {
            return Inertia::location(route('dashboard'));
        }

        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse|Response
    {
        try {
            $request->authenticate();
            $request->session()->regenerate();

            if ($request->header('X-Inertia')) {
                return Inertia::location(route('dashboard'));
            }

            // Just return a normal redirect (correct type)
            return redirect()->intended(route('dashboard'));
        } catch (\Exception $e) {
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
    public function destroy(Request $request): RedirectResponse|Response
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->header('X-Inertia')) {
            return Inertia::location('/');
        }

        // Return a proper redirect (no toResponse needed)
        return redirect('/');
    }
}
