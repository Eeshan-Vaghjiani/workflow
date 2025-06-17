<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\TwoFactorAuthenticationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TwoFactorAuthController extends Controller
{
    /**
     * Display the two-factor authentication settings.
     */
    public function index(Request $request, TwoFactorAuthenticationService $twoFactorService): Response
    {
        $user = $request->user();

        $enabled = $user->hasTwoFactorEnabled();

        return Inertia::render('Settings/TwoFactorAuth', [
            'enabled' => $enabled,
            'qrCode' => $enabled ? null : $this->getQrCode($request, $twoFactorService),
            'recoveryCodes' => $enabled ? $user->recoveryCodes() : [],
            'confirming' => !$enabled && session('confirming_two_factor'),
        ]);
    }

    /**
     * Enable two-factor authentication for the user.
     */
    public function store(Request $request, TwoFactorAuthenticationService $twoFactorService): Response|RedirectResponse
    {
        try {
            $request->validate([
                'code' => ['required', 'string'],
            ]);

            $user = $request->user();

            if ($user->hasTwoFactorEnabled()) {
                return back()->with('error', 'Two-factor authentication is already enabled.');
            }

            // Get the secret from the session
            $secret = session('two_factor_secret');

            if (! $secret || ! $twoFactorService->verify($secret, $request->code)) {
                return back()->withErrors([
                    'code' => 'The provided two-factor authentication code was invalid.',
                ])->withInput();
            }

            // Enable 2FA
            $twoFactorService->enable($user, $secret);

            // Generate recovery codes
            $user->generateRecoveryCodes();

            return back()->with('status', 'Two-factor authentication has been enabled.');
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            return back()->withErrors([
                'code' => 'An error occurred while enabling two-factor authentication.',
            ])->withInput();
        }
    }

    /**
     * Confirm two-factor authentication.
     */
    public function update(Request $request): RedirectResponse
    {
        try {
            $validated = $request->validate([
                'code' => ['required', 'string'],
            ]);

            if (!session('confirming_two_factor')) {
                session(['confirming_two_factor' => true]);
                return back();
            }

            $user = $request->user();
            return back();
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        }
    }

    /**
     * Disable two-factor authentication for the user.
     */
    public function destroy(Request $request, TwoFactorAuthenticationService $twoFactorService): RedirectResponse
    {
        try {
            // Log the request for debugging
            \Illuminate\Support\Facades\Log::info('Attempting to disable 2FA', [
                'user_id' => $request->user()->id,
                'has_2fa' => $request->user()->hasTwoFactorEnabled(),
            ]);

            $request->validate([
                'password' => ['required', 'current_password'],
            ]);

            $user = $request->user();

            if (!$user->hasTwoFactorEnabled()) {
                return back()->with('error', 'Two-factor authentication is not enabled.');
            }

            // Disable 2FA
            $twoFactorService->disable($user);

            // Mark the session as 2FA authenticated to avoid redirects
            session(['two_factor_authenticated' => true]);

            // Log success
            \Illuminate\Support\Facades\Log::info('2FA disabled successfully', [
                'user_id' => $user->id,
            ]);

            return back()->with('status', 'Two-factor authentication has been disabled.');
        } catch (ValidationException $e) {
            \Illuminate\Support\Facades\Log::error('2FA disable validation error', [
                'errors' => $e->errors(),
                'user_id' => $request->user()->id ?? 'unknown',
            ]);
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('2FA disable error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $request->user()->id ?? 'unknown',
            ]);
            return back()->withErrors([
                'password' => 'An error occurred while disabling two-factor authentication.',
            ])->withInput();
        }
    }

    /**
     * Generate new recovery codes for the user.
     */
    public function recoveryCodeRegenerate(Request $request): RedirectResponse
    {
        try {
            $request->validate([
                'password' => ['required', 'current_password'],
            ]);

            $request->user()->generateRecoveryCodes();

            return back()->with('status', 'Recovery codes regenerated.');
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        }
    }

    /**
     * Get the QR code SVG for the user.
     */
    protected function getQrCode(Request $request, TwoFactorAuthenticationService $twoFactorService): string
    {
        $user = $request->user();

        // Generate a new secret key
        $secret = $twoFactorService->generateSecretKey();

        // Store the secret in the session
        session(['two_factor_secret' => $secret]);

        // Generate QR code
        return $twoFactorService->qrCodeSvg(
            config('app.name'),
            $user->email,
            $secret
        );
    }
}
