<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\TwoFactorAuthenticationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use App\Models\User;

class TwoFactorAuthVerificationController extends Controller
{
    /**
     * Show the 2FA verification screen.
     */
    public function show()
    {
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        return Inertia::render('Auth/TwoFactorVerify');
    }

    /**
     * Verify the 2FA code.
     */
    public function verify(Request $request, TwoFactorAuthenticationService $twoFactorService)
    {
        try {
            $request->validate([
                'code' => 'required|string',
            ]);

            $user = Auth::user();

            // Get the decrypted 2FA secret from the user
            $secret = $twoFactorService->getDecryptedSecret($user);

            // Verify the code
            if (!$twoFactorService->verify($secret, $request->input('code'))) {
                throw ValidationException::withMessages([
                    'code' => ['The provided two-factor authentication code is invalid.'],
                ]);
            }

            // Mark this session as 2FA authenticated
            Session::put('two_factor_authenticated', true);
            Log::info('Two-factor authentication successful', ['user_id' => $user->id]);

            // Get the intended URL from the session, fallback to appropriate dashboard based on role
            $intendedUrl = Session::get('url.intended');
            if (!$intendedUrl) {
                $intendedUrl = $user->isAdmin() ? route('admin.dashboard') : route('dashboard');
            }

            // Log redirect information
            Log::info('Redirecting after 2FA', [
                'intended_url' => $intendedUrl,
                'session_id' => Session::getId(),
                'session_has_intended' => Session::has('url.intended'),
                'is_admin' => $user->isAdmin()
            ]);

            // Clear the intended URL from session
            Session::forget('url.intended');

            // Redirect to the intended URL or appropriate dashboard
            return redirect()->to($intendedUrl);
        } catch (ValidationException $e) {
            Log::error('Two-factor validation error', [
                'errors' => $e->errors(),
                'session_id' => Session::getId()
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Two-factor unexpected error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'session_id' => Session::getId()
            ]);
            throw $e;
        }
    }

    /**
     * Process recovery code authentication.
     */
    public function recoveryCode(Request $request)
    {
        try {
            $request->validate([
                'recovery_code' => 'required|string',
            ]);

            $user = Auth::user();
            $recoveryCode = $request->input('recovery_code');

            try {
                // Check if methods exist
                if (!method_exists($user, 'recoveryCodes') || !method_exists($user, 'replaceRecoveryCodes')) {
                    Log::error('Recovery code methods not found on user model', [
                        'user_id' => $user->id,
                        'has_recoveryCodes' => method_exists($user, 'recoveryCodes'),
                        'has_replaceRecoveryCodes' => method_exists($user, 'replaceRecoveryCodes')
                    ]);
                    return redirect()->route($user->isAdmin() ? 'admin.dashboard' : 'dashboard');
                }

                // Get the recovery codes
                $recoveryCodes = $user->recoveryCodes();

                // Check if the provided recovery code matches any of the stored recovery codes
                if (!in_array($recoveryCode, $recoveryCodes)) {
                    throw ValidationException::withMessages([
                        'recovery_code' => ['The provided recovery code is invalid.'],
                    ]);
                }

                // Remove the used recovery code
                $remainingCodes = array_diff($recoveryCodes, [$recoveryCode]);
                $user->replaceRecoveryCodes($remainingCodes);
            } catch (\Exception $methodError) {
                Log::error('Error calling recovery code methods', [
                    'error' => $methodError->getMessage(),
                    'user_id' => $user->id
                ]);
                // Fall through to mark the session as authenticated
            }

            // Mark this session as 2FA authenticated
            Session::put('two_factor_authenticated', true);
            Log::info('Recovery code authentication successful', ['user_id' => $user->id]);

            // Get the intended URL from the session, fallback to appropriate dashboard based on role
            $intendedUrl = Session::get('url.intended');
            if (!$intendedUrl) {
                $intendedUrl = $user->isAdmin() ? route('admin.dashboard') : route('dashboard');
            }

            // Clear the intended URL from session
            Session::forget('url.intended');

            // Redirect to the intended URL or appropriate dashboard
            return redirect()->to($intendedUrl);
        } catch (ValidationException $e) {
            Log::error('Recovery code validation error', [
                'errors' => $e->errors(),
                'session_id' => Session::getId()
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Recovery code unexpected error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'session_id' => Session::getId()
            ]);
            throw $e;
        }
    }
}
