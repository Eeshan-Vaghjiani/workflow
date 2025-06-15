<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TwoFactorAuthController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\WorkOS\Http\Middleware\ValidateSessionWithWorkOS;

Route::middleware([
    'auth',
    ValidateSessionWithWorkOS::class,
])->group(function () {
    Route::redirect('settings', 'settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('settings/password', [PasswordController::class, 'update'])->name('password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance');

    // Two-Factor Authentication Settings
    Route::get('settings/two-factor-auth', [TwoFactorAuthController::class, 'index'])
        ->name('settings.two-factor-auth');
    Route::post('settings/two-factor-auth', [TwoFactorAuthController::class, 'store'])->name('two-factor.store');
    Route::put('settings/two-factor-auth', [TwoFactorAuthController::class, 'update'])->name('two-factor.update');
    Route::delete('settings/two-factor-auth', [TwoFactorAuthController::class, 'destroy'])->name('two-factor.destroy');
    Route::post('settings/two-factor-auth/recovery-codes', [TwoFactorAuthController::class, 'recoveryCodeRegenerate'])
        ->name('two-factor.recovery-codes');
});
