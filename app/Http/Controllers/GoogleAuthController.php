<?php

namespace App\Http\Controllers;

use App\Models\GoogleCalendar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Inertia\Inertia;

class GoogleAuthController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirectToGoogle()
    {
        try {
            $clientId = config('services.google.client_id');
            $redirectUri = config('services.google.redirect');

            // Add thorough logging
            \Illuminate\Support\Facades\Log::info('Google OAuth redirect attempt', [
                'client_id' => substr($clientId ?? '', 0, 8) . '...',
                'redirect_uri' => $redirectUri,
                'user_id' => Auth::id() ?? 'guest',
                'configured' => !empty($clientId) && !empty($redirectUri),
                'server' => $_SERVER['SERVER_NAME'] ?? 'unknown',
                'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
            ]);

            // Ensure we have the required values
            if (empty($clientId) || empty($redirectUri)) {
                \Illuminate\Support\Facades\Log::error('Google OAuth missing configuration', [
                    'client_id_exists' => !empty($clientId),
                    'redirect_uri_exists' => !empty($redirectUri)
                ]);

                return redirect()->route('calendar.settings')
                    ->with('error', 'Google Calendar integration is not properly configured. Please check your .env file.');
            }

            // Build the Google OAuth URL with all required parameters
            $url = 'https://accounts.google.com/o/oauth2/v2/auth';
            $params = [
                'client_id' => $clientId,
                'redirect_uri' => $redirectUri,
                'response_type' => 'code', // Ensure this is included
                'scope' => 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
                'access_type' => 'offline',
                'prompt' => 'consent select_account'
            ];

            // Add optional email hint if available
            if (Auth::check() && !empty(Auth::user()->email)) {
                $params['login_hint'] = Auth::user()->email;
            }

            // Log the redirect URL for debugging (sanitize the client_id)
            $logParams = $params;
            $logParams['client_id'] = substr($logParams['client_id'], 0, 8) . '...';

            \Illuminate\Support\Facades\Log::info('Google OAuth redirect URL', [
                'url' => $url . '?' . http_build_query($params),
                'params' => $logParams
            ]);

            // Additional logging for debugging redirect issues
            $finalRedirectUrl = $url . '?' . http_build_query($params);
            \Illuminate\Support\Facades\Log::debug('Complete Google OAuth redirect URL', [
                'full_url' => $finalRedirectUrl,
                'redirect_uri' => $redirectUri,
                'user_id' => Auth::id() ?? 'guest'
            ]);

            // Create a simple view with a redirect script to avoid CORS issues
            return view('google.redirect', [
                'url' => $finalRedirectUrl,
                'message' => 'Redirecting to Google Authentication...'
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Google OAuth redirect error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'redirect_uri' => $redirectUri ?? 'not set',
                'client_id_set' => !empty($clientId),
                'server_name' => $_SERVER['SERVER_NAME'] ?? 'unknown'
            ]);

            return redirect()->route('calendar.settings')
                ->with('error', 'Error connecting to Google: ' . $e->getMessage());
        }
    }

    /**
     * Handle the callback from Google OAuth.
     */
    public function handleGoogleCallback(Request $request)
    {
        try {
            // Log the full callback data for debugging (sanitize sensitive info)
            $logData = $request->all();
            if (isset($logData['code'])) {
                $logData['code'] = substr($logData['code'], 0, 10) . '...';
            }

            Log::info('Google OAuth Callback received', [
                'data' => $logData,
                'user_id' => Auth::id() ?? 'guest',
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            // Check for errors from Google
            if ($request->has('error')) {
                $error = $request->get('error');
                $errorDescription = $request->get('error_description') ?? 'Unknown error';

                Log::error('Google OAuth Error', [
                    'error' => $error,
                    'error_description' => $errorDescription,
                    'user_id' => Auth::id()
                ]);

                return redirect()->route('calendar.settings')
                    ->with('error', "Google Calendar authorization failed: {$errorDescription}");
            }

            // Check for authorization code
            $code = $request->get('code');
            if (empty($code)) {
                Log::error('Google OAuth Missing Code', [
                    'user_id' => Auth::id(),
                    'query' => $request->all()
                ]);

                return redirect()->route('calendar.settings')
                    ->with('error', 'No authorization code received from Google');
            }

            // Get config values
            $clientId = config('services.google.client_id');
            $clientSecret = config('services.google.client_secret');
            $redirectUri = config('services.google.redirect');

            // Log the configuration used (sanitize sensitive info)
            Log::info('Google OAuth Config', [
                'client_id' => substr($clientId ?? '', 0, 8) . '...',
                'client_secret_exists' => !empty($clientSecret),
                'redirect_uri' => $redirectUri,
                'user_id' => Auth::id()
            ]);

            // Validate config
            if (empty($clientId) || empty($clientSecret) || empty($redirectUri)) {
                Log::error('Google OAuth Invalid Config', [
                    'client_id_exists' => !empty($clientId),
                    'client_secret_exists' => !empty($clientSecret),
                    'redirect_uri_exists' => !empty($redirectUri),
                    'user_id' => Auth::id()
                ]);

                return redirect()->route('calendar.settings')
                    ->with('error', 'Google Calendar integration is not properly configured');
            }

            // Exchange authorization code for access token
            try {
                // First log the attempt
                Log::info('Exchanging authorization code for access token', [
                    'user_id' => Auth::id(),
                    'code_length' => strlen($code)
                ]);

                $withoutVerify = config('services.google.verify_ssl') === false;
                $httpClient = Http::withOptions([
                    'verify' => !$withoutVerify
                ]);

                if ($withoutVerify) {
                    Log::warning('SSL verification is disabled for Google API calls');
                }

                $response = $httpClient->post('https://oauth2.googleapis.com/token', [
                    'client_id' => $clientId,
                    'client_secret' => $clientSecret,
                    'code' => $code,
                    'redirect_uri' => $redirectUri,
                    'grant_type' => 'authorization_code',
                ]);

                if (!$response->successful()) {
                    $responseData = $response->json() ?? ['error' => 'Unknown error', 'error_description' => 'No response body'];

                    Log::error('Google OAuth Token Error', [
                        'status' => $response->status(),
                        'error' => $responseData['error'] ?? 'Unknown error',
                        'error_description' => $responseData['error_description'] ?? 'No description',
                        'user_id' => Auth::id()
                    ]);

                    return redirect()->route('calendar.settings')
                        ->with('error', 'Failed to obtain authorization from Google: ' .
                            ($responseData['error_description'] ?? $responseData['error'] ?? 'Unknown error'));
                }

                $tokenData = $response->json();
                Log::info('Received OAuth token', [
                    'user_id' => Auth::id(),
                    'expires_in' => $tokenData['expires_in'] ?? 'not provided',
                    'has_refresh_token' => isset($tokenData['refresh_token']),
                    'token_type' => $tokenData['token_type'] ?? 'not provided'
                ]);

                // Make API call to get calendar info
                $calendarResponse = Http::withOptions([
                    'verify' => !$withoutVerify
                ])->withToken($tokenData['access_token'])
                    ->get('https://www.googleapis.com/calendar/v3/calendars/primary');

                if (!$calendarResponse->successful()) {
                    $calResponseData = $calendarResponse->json() ?? ['error' => 'Unknown error'];

                    Log::error('Google Calendar Fetch Error', [
                        'status' => $calendarResponse->status(),
                        'error' => $calResponseData['error']['message'] ?? $calResponseData['error'] ?? 'Unknown error',
                        'user_id' => Auth::id()
                    ]);

                    return redirect()->route('calendar.settings')
                        ->with('error', 'Failed to fetch Google Calendar information: ' .
                            ($calResponseData['error']['message'] ?? 'API error'));
                }

                $calendarData = $calendarResponse->json();

                if (empty($calendarData['id'])) {
                    Log::error('Google Calendar Missing ID', [
                        'response' => $calendarData,
                        'user_id' => Auth::id()
                    ]);

                    return redirect()->route('calendar.settings')
                        ->with('error', 'Failed to retrieve calendar identifier');
                }

                // Store or update Google Calendar credentials
                GoogleCalendar::updateOrCreate(
                    ['user_id' => Auth::id()],
                    [
                        'access_token' => $tokenData['access_token'],
                        'refresh_token' => $tokenData['refresh_token'] ?? null,
                        'token_expires_at' => Carbon::now()->addSeconds($tokenData['expires_in'] ?? 3600),
                        'calendar_id' => $calendarData['id'],
                    ]
                );

                Log::info('Google Calendar Connected', [
                    'user_id' => Auth::id(),
                    'calendar_id' => $calendarData['id'],
                    'calendar_summary' => $calendarData['summary'] ?? 'Primary Calendar'
                ]);

                return redirect()->route('calendar.settings')
                    ->with('success', 'Google Calendar connected successfully');
            } catch (\Exception $e) {
                Log::error('Google OAuth Exception', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                    'user_id' => Auth::id() ?? 'Not authenticated'
                ]);

                return redirect()->route('calendar.settings')
                    ->with('error', 'Failed to connect to Google Calendar: ' . $e->getMessage());
            }
        } catch (\Exception $e) {
            Log::error('Google OAuth Exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id() ?? 'Not authenticated'
            ]);

            return redirect()->route('calendar.settings')
                ->with('error', 'Failed to connect to Google Calendar: ' . $e->getMessage());
        }
    }

    /**
     * Disconnect the user's Google Calendar.
     */
    public function disconnect()
    {
        try {
            $user = Auth::user();
            $googleCalendar = GoogleCalendar::where('user_id', $user->id)->first();

            if (!$googleCalendar) {
                return redirect()->route('calendar.settings')
                    ->with('error', 'No Google Calendar connection found.');
            }

            // Attempt to revoke the token with Google
            if ($googleCalendar->access_token) {
                try {
                    Http::get('https://accounts.google.com/o/oauth2/revoke', [
                        'token' => $googleCalendar->access_token
                    ]);

                    Log::info('Google Calendar token revoked', [
                        'user_id' => $user->id
                    ]);
                } catch (\Exception $e) {
                    // Just log the error but continue with disconnection
                    Log::warning('Failed to revoke Google Calendar token', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Delete the Google Calendar connection
            $googleCalendar->delete();

            Log::info('Google Calendar disconnected', [
                'user_id' => $user->id
            ]);

            return redirect()->route('calendar.settings')
                ->with('success', 'Google Calendar disconnected successfully.');
        } catch (\Exception $e) {
            Log::error('Error disconnecting Google Calendar', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);

            return redirect()->route('calendar.settings')
                ->with('error', 'Failed to disconnect Google Calendar: ' . $e->getMessage());
        }
    }

    /**
     * Show the calendar settings page with Google Calendar connection status.
     */
    public function settings()
    {
        try {
            $user = Auth::user();
            $googleCalendar = GoogleCalendar::where('user_id', $user->id)->first();

            // Check if Google API credentials are properly configured
            $clientId = config('services.google.client_id');
            $clientSecret = config('services.google.client_secret');
            $redirectUri = config('services.google.redirect');

            $missingCredentials = empty($clientId) || empty($clientSecret) || empty($redirectUri);

            if ($missingCredentials) {
                Log::warning('Google Calendar credentials missing', [
                    'user_id' => $user->id,
                    'client_id_exists' => !empty($clientId),
                    'client_secret_exists' => !empty($clientSecret),
                    'redirect_uri_exists' => !empty($redirectUri)
                ]);

                // Flash an error message if credentials are missing
                session()->flash('error', 'Google Calendar integration is not properly configured. Please check your .env file for GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.');
            }

            $googleCalendarConnected = !is_null($googleCalendar);
            $googleCalendarInfo = null;

            if ($googleCalendarConnected) {
                // Check if token is expired and needs refresh
                if ($googleCalendar->token_expires_at && $googleCalendar->token_expires_at < now() && $googleCalendar->refresh_token) {
                    try {
                        // Attempt to refresh the token
                        $response = Http::post('https://oauth2.googleapis.com/token', [
                            'client_id' => config('services.google.client_id'),
                            'client_secret' => config('services.google.client_secret'),
                            'refresh_token' => $googleCalendar->refresh_token,
                            'grant_type' => 'refresh_token',
                        ]);

                        if ($response->successful()) {
                            $data = $response->json();

                            // Update the access token and expiration time
                            $googleCalendar->update([
                                'access_token' => $data['access_token'],
                                'token_expires_at' => Carbon::now()->addSeconds($data['expires_in'] ?? 3600),
                            ]);

                            Log::info('Google Calendar token refreshed', [
                                'user_id' => $user->id,
                                'expires_at' => $googleCalendar->token_expires_at
                            ]);
                        } else {
                            Log::error('Failed to refresh Google Calendar token', [
                                'user_id' => $user->id,
                                'response' => $response->json(),
                                'status' => $response->status()
                            ]);
                        }
                    } catch (\Exception $e) {
                        Log::error('Exception refreshing Google Calendar token', [
                            'user_id' => $user->id,
                            'error' => $e->getMessage()
                        ]);
                    }
                }

                // Format connection information for display
                $googleCalendarInfo = [
                    'calendar_id' => $googleCalendar->calendar_id,
                    'connected_at' => $googleCalendar->created_at->format('F j, Y, g:i a'),
                    'expires_at' => $googleCalendar->token_expires_at ? $googleCalendar->token_expires_at->format('F j, Y, g:i a') : null,
                ];
            }

            // Generate a direct Google OAuth URL for the frontend
            $googleAuthUrl = null;
            if (!$missingCredentials) {
                $url = 'https://accounts.google.com/o/oauth2/v2/auth';
                $params = [
                    'client_id' => $clientId,
                    'redirect_uri' => $redirectUri,
                    'response_type' => 'code',
                    'scope' => 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
                    'access_type' => 'offline',
                    'prompt' => 'consent select_account'
                ];

                // Add optional email hint if available
                if ($user && !empty($user->email)) {
                    $params['login_hint'] = $user->email;
                }

                $googleAuthUrl = $url . '?' . http_build_query($params);

                Log::info('Generated Google OAuth URL for frontend', [
                    'user_id' => $user->id,
                    'url_length' => strlen($googleAuthUrl)
                ]);
            }

            return Inertia::render('Calendar/Settings', [
                'googleCalendarConnected' => $googleCalendarConnected,
                'googleCalendarInfo' => $googleCalendarInfo,
                'googleAuthUrl' => $googleAuthUrl,
                'configValid' => !$missingCredentials
            ]);
        } catch (\Exception $e) {
            Log::error('Error in Google Calendar settings page', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id() ?? 'Not authenticated'
            ]);

            return Inertia::render('Calendar/Settings', [
                'googleCalendarConnected' => false,
                'googleCalendarInfo' => null,
                'configValid' => false,
                'error' => 'Error loading calendar settings: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Save the user's Google Calendar settings.
     */
    public function saveSettings(Request $request)
    {
        try {
            // Validate request data
            $validated = $request->validate([
                'calendar_id' => 'required|string|max:255',
            ]);

            $user = Auth::user();

            // Find the user's Google Calendar connection
            $googleCalendar = GoogleCalendar::where('user_id', $user->id)->first();

            if (!$googleCalendar) {
                Log::warning('Attempted to save Google Calendar ID but no connection exists', [
                    'user_id' => $user->id
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'You need to connect your Google account before setting a calendar ID'
                ], 400);
            }

            // Update the calendar ID
            $googleCalendar->calendar_id = $validated['calendar_id'];
            $googleCalendar->save();

            Log::info('Google Calendar ID saved', [
                'user_id' => $user->id,
                'calendar_id' => $validated['calendar_id']
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Google Calendar ID saved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error saving Google Calendar settings', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id() ?? 'Not authenticated'
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to save settings: ' . $e->getMessage()
            ], 500);
        }
    }
}
