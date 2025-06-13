<?php
// fix_google_sync.php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\GoogleCalendar;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

echo "Starting Google Calendar sync fix script...\n";

// Get the first user (adjust as needed)
$user = User::first();
if (!$user) {
    echo "No user found. Please make sure you have at least one user in your database.\n";
    exit;
}

echo "Found user: {$user->id} ({$user->name} - {$user->email})\n";

// Get Google Calendar connection
$googleCalendar = GoogleCalendar::where('user_id', $user->id)->first();
if (!$googleCalendar) {
    echo "No Google Calendar connection found for user {$user->id}.\n";
    echo "Please run fix_google_connection.php first.\n";
    exit;
}

echo "Found Google Calendar connection. Current state:\n";
echo "Access Token: " . substr($googleCalendar->access_token, 0, 10) . "...\n";
echo "Refresh Token: " . ($googleCalendar->refresh_token ? substr($googleCalendar->refresh_token, 0, 10) . "..." : "NULL") . "\n";
echo "Token Expires At: " . ($googleCalendar->token_expires_at ? $googleCalendar->token_expires_at : "NULL") . "\n";
echo "Calendar ID: " . $googleCalendar->calendar_id . "\n";

// Load credentials from .env file
$clientId = env('GOOGLE_CLIENT_ID');
$clientSecret = env('GOOGLE_CLIENT_SECRET');

if (empty($clientId) || empty($clientSecret)) {
    echo "Error: Google API credentials are missing in .env file.\n";
    exit;
}

// Option 1: Check GoogleCalendar model's syncEvents method
echo "\nChecking syncEvents method...\n";
try {
    // Create a reflection method to check syncEvents
    $reflectionClass = new ReflectionClass($googleCalendar);
    $syncMethod = $reflectionClass->getMethod('syncEvents');
    echo "syncEvents method exists: " . ($syncMethod ? "YES" : "NO") . "\n";
    echo "Number of parameters required: " . $syncMethod->getNumberOfRequiredParameters() . "\n";
} catch (\Exception $e) {
    echo "Error checking syncEvents method: " . $e->getMessage() . "\n";
}

// Option 2: Since we have temporary tokens, we need to fix them
echo "\nAttempting to fix tokens...\n";

// Option A: If you have a valid refresh token from a previous OAuth flow
if (false) { // Change to true if you have a valid refresh token to use
    $validRefreshToken = "YOUR_VALID_REFRESH_TOKEN_HERE";
    $googleCalendar->refresh_token = $validRefreshToken;
    $googleCalendar->save();

    echo "Updated with valid refresh token. Now attempting to refresh access token...\n";

    try {
        $response = Http::post('https://oauth2.googleapis.com/token', [
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'refresh_token' => $googleCalendar->refresh_token,
            'grant_type' => 'refresh_token',
        ]);

        if ($response->successful()) {
            $data = $response->json();

            $googleCalendar->access_token = $data['access_token'];
            $googleCalendar->token_expires_at = Carbon::now()->addSeconds($data['expires_in'] ?? 3600);
            $googleCalendar->save();

            echo "Successfully refreshed access token!\n";
        } else {
            echo "Failed to refresh token: " . $response->status() . " - " . json_encode($response->json()) . "\n";
        }
    } catch (\Exception $e) {
        echo "Exception during token refresh: " . $e->getMessage() . "\n";
    }
}

// Option B: Use our GoogleAuthController to handle the OAuth flow - this is the recommended approach
echo "\nRecommendation: Click 'Reconnect Calendar' on the Calendar Settings page to complete the OAuth flow.\n";
echo "This will replace the temporary tokens with valid ones from Google.\n";

// Option C: Create a minimal test implementation for syncEvents to avoid errors
echo "\nImplementing a test fix for the syncEvents method...\n";

try {
    // Add a temporary implementation to the GoogleCalendar class to make syncEvents succeed
    if (method_exists($googleCalendar, 'syncEvents')) {
        echo "The syncEvents method exists, but may be causing errors. Let's check the storage directory...\n";

        // Check Laravel logs for detailed error
        $logsDir = storage_path('logs');
        echo "Logs directory: $logsDir\n";

        $latestLogFile = null;
        $latestTimestamp = 0;

        if (is_dir($logsDir)) {
            foreach (scandir($logsDir) as $file) {
                if (strpos($file, 'laravel') === 0) {
                    $filePath = $logsDir . '/' . $file;
                    $fileTime = filemtime($filePath);
                    if ($fileTime > $latestTimestamp) {
                        $latestTimestamp = $fileTime;
                        $latestLogFile = $filePath;
                    }
                }
            }
        }

        if ($latestLogFile) {
            echo "Latest log file: $latestLogFile\n";
            echo "Checking last 20 lines for sync errors...\n";

            $logContent = file($latestLogFile);
            $lastLines = array_slice($logContent, max(0, count($logContent) - 20));

            foreach ($lastLines as $line) {
                if (strpos($line, 'Calendar sync failed') !== false ||
                    strpos($line, 'Google Calendar') !== false ||
                    strpos($line, 'syncEvents') !== false) {
                    echo "Found relevant log entry:\n";
                    echo $line . "\n";
                }
            }
        }
    } else {
        echo "The syncEvents method doesn't exist on the GoogleCalendar model!\n";
    }
} catch (\Exception $e) {
    echo "Error implementing test fix: " . $e->getMessage() . "\n";
}

echo "\nScript completed. Here are the next recommended steps:\n";
echo "1. Go to Calendar Settings page\n";
echo "2. Click 'Reconnect Calendar' to get valid OAuth tokens\n";
echo "3. Check Laravel logs for detailed error messages: storage/logs/laravel*.log\n";
echo "4. Try syncing again after reconnecting\n";
