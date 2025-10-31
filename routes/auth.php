<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\TwoFactorAuthVerificationController;
use App\Http\Controllers\Auth\VerifyEmailController;
use Illuminate\Support\Facades\Route;
use Laravel\WorkOS\Http\Requests\AuthKitAuthenticationRequest;
use Laravel\WorkOS\Http\Requests\AuthKitLoginRequest;
use Laravel\WorkOS\Http\Requests\AuthKitLogoutRequest;
use Laravel\WorkOS\User;
use App\Models\User as AppUser;
use Illuminate\Support\Str;

// WorkOS AuthKit routes
Route::get('login', function (AuthKitLoginRequest $request) {
    // Store the redirect URL in the session if provided
    if (request()->has('redirect')) {
        session(['auth_redirect' => request()->input('redirect')]);
    }

    // Just return the redirect without trying to set the URI
    return $request->redirect();
})->middleware(['guest'])->name('login');

Route::get('authenticate', function (AuthKitAuthenticationRequest $request) {
    // Get the stored redirect URL from the session
    $redirect = session('auth_redirect');

    // Clear the session variable
    session()->forget('auth_redirect');

    // Redirect to the stored URL or to the dashboard
    $redirectRoute = $redirect ? redirect($redirect) : to_route('auth.success');

    return tap($redirectRoute, fn () => $request->authenticate(
        function ($workosId) {
            // First try to find user by WorkOS ID
            $existingUser = AppUser::where('workos_id', $workosId)->first();

            // If found by WorkOS ID, return the user
            if ($existingUser) {
                $existingUser->update(['last_login_at' => now()]);
                return $existingUser;
            }

            // No user found by WorkOS ID, return null to proceed to createUsing
            return null;
        },
        function (User $user) {
            // Check if a user with this email already exists
            $existingUser = AppUser::where('email', $user->email)->first();

            if ($existingUser) {
                // Update the existing user with WorkOS data
                $existingUser->update([
                    'workos_id' => $user->id,
                    'avatar' => $user->avatar ?? $existingUser->avatar,
                    'last_login_at' => now(),
                ]);
                return $existingUser;
            }

            // Create a new user if no existing user was found
            $newUser = AppUser::create([
                'name' => $user->firstName.' '.$user->lastName,
                'email' => $user->email,
                'email_verified_at' => now(),
                'workos_id' => $user->id,
                'avatar' => $user->avatar ?? '',
                'password' => bcrypt(Str::random(32)), // Generate a secure random password
            ]);

            // Only for brand new users, mark the session as already 2FA authenticated
            // since they couldn't have set up 2FA yet
            session(['two_factor_authenticated' => true]);

            return $newUser;
        }
    ));
})->middleware(['web'])->name('authenticate');

Route::post('logout', function (AuthKitLogoutRequest $request) {
    return $request->logout();
})->middleware(['auth'])->name('logout');

// Keep the existing routes for password reset and registration
Route::middleware('guest')->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');

    Route::post('register', [RegisteredUserController::class, 'store']);

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
});

// Keep the existing routes for email verification and password confirmation
Route::middleware('auth')->group(function () {
    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);
});

// Add our two-factor verification routes
Route::middleware(['auth'])->group(function () {
    Route::get('two-factor-verify', [TwoFactorAuthVerificationController::class, 'show'])
        ->name('two-factor.verify');
    Route::post('two-factor-verify', [TwoFactorAuthVerificationController::class, 'verify']);
    Route::post('two-factor-recovery', [TwoFactorAuthVerificationController::class, 'recoveryCode'])
        ->name('two-factor.recovery-code');
});
