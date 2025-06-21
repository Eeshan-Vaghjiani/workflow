<?php
// fix_google_connection.php

/**
 * Google Calendar Connection Diagnostic Tool
 *
 * This script helps diagnose and fix issues with Google Calendar OAuth integration.
 * Run this script from your project root with: php fix_google_connection.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\GoogleCalendar;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;

echo "Google Calendar Connection Diagnostic Tool\n";
echo "========================================\n\n";

// 1. Check environment variables
echo "1. Checking Google OAuth Environment Variables:\n";
$clientId = env('GOOGLE_CLIENT_ID');
$clientSecret = env('GOOGLE_CLIENT_SECRET');
$redirectUri = env('GOOGLE_REDIRECT_URI');
$verifySSL = env('GOOGLE_API_VERIFY_SSL');

$idStatus = $clientId ? "✅ SET: " . substr($clientId, 0, 8) . "..." : "❌ MISSING";
$secretStatus = $clientSecret ? "✅ SET (hidden for security)" : "❌ MISSING";
$redirectStatus = $redirectUri ? "✅ SET: $redirectUri" : "❌ MISSING";
$sslStatus = $verifySSL === "false" ? "⚠️ SSL Verification DISABLED" : "✅ SSL Verification Enabled";

echo "   GOOGLE_CLIENT_ID: $idStatus\n";
echo "   GOOGLE_CLIENT_SECRET: $secretStatus\n";
echo "   GOOGLE_REDIRECT_URI: $redirectStatus\n";
echo "   GOOGLE_API_VERIFY_SSL: $sslStatus\n\n";

// 2. Check config values
echo "2. Checking Configuration Values:\n";
$configClientId = Config::get('services.google.client_id');
$configClientSecret = Config::get('services.google.client_secret');
$configRedirectUri = Config::get('services.google.redirect');

$configIdStatus = $configClientId ? "✅ SET: " . substr($configClientId, 0, 8) . "..." : "❌ MISSING";
$configSecretStatus = $configClientSecret ? "✅ SET (hidden for security)" : "❌ MISSING";
$configRedirectStatus = $configRedirectUri ? "✅ SET: $configRedirectUri" : "❌ MISSING";

echo "   services.google.client_id: $configIdStatus\n";
echo "   services.google.client_secret: $configSecretStatus\n";
echo "   services.google.redirect: $configRedirectStatus\n\n";

// 3. Check for mismatches
echo "3. Checking for Mismatches:\n";
if ($clientId !== $configClientId) {
    echo "   ❌ MISMATCH: Environment GOOGLE_CLIENT_ID doesn't match config value\n";
}
if ($clientSecret !== $configClientSecret) {
    echo "   ❌ MISMATCH: Environment GOOGLE_CLIENT_SECRET doesn't match config value\n";
}
if ($redirectUri !== $configRedirectUri) {
    echo "   ❌ MISMATCH: Environment GOOGLE_REDIRECT_URI doesn't match config value\n";
}

if ($clientId === $configClientId && $clientSecret === $configClientSecret && $redirectUri === $configRedirectUri) {
    echo "   ✅ All configuration values match their environment variables\n";
}
echo "\n";

// 4. Check the database
echo "4. Checking Database for Google Calendar Connections:\n";
try {
    $googleCalendars = DB::table('google_calendars')->get();
    if (count($googleCalendars) > 0) {
        echo "   ✅ Found " . count($googleCalendars) . " Google Calendar connections\n";
        foreach ($googleCalendars as $index => $calendar) {
            $hasAccessToken = !empty($calendar->access_token);
            $hasRefreshToken = !empty($calendar->refresh_token);
            $tokenStatus = $hasAccessToken ? "✅" : "❌";
            $refreshStatus = $hasRefreshToken ? "✅" : "❌";
            $expiry = $calendar->token_expires_at ? new DateTime($calendar->token_expires_at) : null;
            $isExpired = $expiry && $expiry < new DateTime();
            $expiryStatus = $expiry ? ($isExpired ? "❌ EXPIRED" : "✅ Valid until " . $expiry->format('Y-m-d H:i:s')) : "❌ No expiry";

            echo "   Connection #" . ($index + 1) . " (User ID: " . $calendar->user_id . "):\n";
            echo "     - Access Token: $tokenStatus " . ($hasAccessToken ? substr($calendar->access_token, 0, 10) . "..." : "Missing") . "\n";
            echo "     - Refresh Token: $refreshStatus " . ($hasRefreshToken ? "Present" : "Missing") . "\n";
            echo "     - Expiry: $expiryStatus\n";
            echo "     - Calendar ID: " . ($calendar->calendar_id ?? "Not set") . "\n";
        }
    } else {
        echo "   ⚠️ No Google Calendar connections found in the database\n";
    }
} catch (Exception $e) {
    echo "   ❌ Error accessing database: " . $e->getMessage() . "\n";
}
echo "\n";

// 5. Test redirect URL
echo "5. Testing Redirect URL:\n";
$currentHost = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : "localhost:8000";
$appUrl = env('APP_URL', "http://$currentHost");

$testUrl = $redirectUri;
$suggestedUrl = $appUrl . "/google/callback";

echo "   Current Redirect URI: $testUrl\n";
echo "   Based on APP_URL configuration, should be: $suggestedUrl\n";

if ($testUrl !== $suggestedUrl) {
    echo "   ⚠️ Redirect URI may not match your current application URL\n";
    echo "      This can cause Google OAuth to fail with 'redirect_uri_mismatch' error\n";
}

// Determine if hostname is localhost or an IP
$urlParts = parse_url($testUrl);
$hostname = $urlParts['host'] ?? '';
if ($hostname === 'localhost' || preg_match('/^[0-9\.]+$/', $hostname)) {
    echo "   ⚠️ Your redirect URI uses '$hostname' which may cause issues with Google OAuth\n";
    echo "      Google OAuth requires public URLs - use a tool like ngrok for local testing\n";
}
echo "\n";

// 6. Check routes
echo "6. Checking Route Configuration:\n";
try {
    $routes = app('router')->getRoutes();
    $authFound = false;
    $callbackFound = false;

    foreach ($routes->getRoutes() as $route) {
        if (strpos($route->uri, 'google/auth') !== false) {
            $authFound = true;
            echo "   ✅ Found google/auth route: " . implode(", ", $route->methods) . " /" . $route->uri . "\n";
        }
        if (strpos($route->uri, 'google/callback') !== false) {
            $callbackFound = true;
            echo "   ✅ Found google/callback route: " . implode(", ", $route->methods) . " /" . $route->uri . "\n";
        }
    }

    if (!$authFound) {
        echo "   ❌ Missing google/auth route\n";
    }
    if (!$callbackFound) {
        echo "   ❌ Missing google/callback route\n";
    }
} catch (Exception $e) {
    echo "   ❌ Error checking routes: " . $e->getMessage() . "\n";
}
echo "\n";

// 7. Verify Google Console settings
echo "7. Google Cloud Console Configuration:\n";
echo "   ⚠️ Manual Verification Required\n";
echo "   Please check your Google Cloud Console configuration at: https://console.cloud.google.com/apis/credentials\n";
echo "   Ensure your OAuth Client ID has the following settings:\n";
echo "   - Web application type\n";
echo "   - Authorized JavaScript origins includes: $appUrl\n";
echo "   - Authorized redirect URIs includes: $redirectUri\n";
echo "   - API scopes include: https://www.googleapis.com/auth/calendar and https://www.googleapis.com/auth/calendar.events\n";
echo "\n";

// 8. Recommendations
echo "8. Recommendations:\n";

if (!$clientId || !$clientSecret || !$redirectUri) {
    echo "   ❌ Set the missing Google OAuth environment variables in your .env file\n";
}

if ($redirectUri && $suggestedUrl && $redirectUri !== $suggestedUrl) {
    echo "   ⚠️ Update your GOOGLE_REDIRECT_URI to: $suggestedUrl\n";
    echo "      OR update your Google Cloud Console to match: $redirectUri\n";
}

if ($verifySSL === "false") {
    echo "   ⚠️ SSL verification is disabled. This is insecure and should only be used for testing\n";
}

if (count($googleCalendars ?? []) === 0) {
    echo "   ℹ️ No Google Calendar connections found. Users need to connect their accounts\n";
}

echo "\n";
echo "Diagnostic Complete. To fix issues, update your .env file and/or Google Cloud Console settings.\n";
