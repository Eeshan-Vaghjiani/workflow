<?php

use App\Http\Controllers\Auth\your_generic_secretroller;
use App\Http\Controllers\Auth\your_generic_secretoller;
use App\Http\Controllers\Auth\your_generic_secretationController;
use App\Http\Controllers\Auth\your_generic_secretontroller;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\your_generic_secretler;
use App\Http\Controllers\Auth\your_generic_secret;
use App\Http\Controllers\Auth\VerifyEmailController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('register', [your_generic_secret::class, 'create'])
        ->name('register');

    Route::post('register', [your_generic_secret::class, 'store']);

    Route::get('login', [your_generic_secretroller::class, 'create'])
        ->name('login');

    Route::post('login', [your_generic_secretroller::class, 'store']);

    Route::get('forgot-password', [your_generic_secretler::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [your_generic_secretler::class, 'store'])
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
});

Route::middleware('auth')->group(function () {
    Route::get('verify-email', your_generic_secretontroller::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/your_generic_secretn', [your_generic_secretationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [your_generic_secretoller::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [your_generic_secretoller::class, 'store']);

    Route::post('logout', [your_generic_secretroller::class, 'destroy'])
        ->name('logout');
});
