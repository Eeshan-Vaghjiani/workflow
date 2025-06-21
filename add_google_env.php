<?php
/**
 * Google Calendar Environment Check and Setup
 *
 * This utility helps check and configure the Google Calendar integration environment variables.
 * Run with: php add_google_env.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "\nGoogle Calendar Environment Configuration Helper\n";
echo "=============================================\n\n";

// Read current .env file
$envPath = __DIR__ . '/.env';
$envContent = file_exists($envPath) ? file_get_contents($envPath) : '';

// Track existing variables
$existingVars = [];
preg_match_all('/^(GOOGLE_[A-Z_]+)=(.*)$/m', $envContent, $matches, PREG_SET_ORDER);
foreach ($matches as $match) {
    $existingVars[$match[1]] = $match[2];
}

// 1. Check current environment variables
echo "1. Current Google OAuth Environment Variables:\n";
$clientId = env('GOOGLE_CLIENT_ID');
$clientSecret = env('GOOGLE_CLIENT_SECRET');
$redirectUri = env('GOOGLE_REDIRECT_URI');

$idStatus = $clientId ? "✅ SET: " . substr($clientId, 0, 8) . "..." : "❌ MISSING";
$secretStatus = $clientSecret ? "✅ SET (hidden for security)" : "❌ MISSING";
$redirectStatus = $redirectUri ? "✅ SET: $redirectUri" : "❌ MISSING";

echo "   GOOGLE_CLIENT_ID: $idStatus\n";
echo "   GOOGLE_CLIENT_SECRET: $secretStatus\n";
echo "   GOOGLE_REDIRECT_URI: $redirectStatus\n\n";

// 2. Check if environment variables match configured services
echo "2. Checking Configuration Values:\n";
$configClientId = config('services.google.client_id');
$configClientSecret = config('services.google.client_secret');
$configRedirectUri = config('services.google.redirect');

$configIdStatus = $configClientId ? "✅ SET: " . substr($configClientId, 0, 8) . "..." : "❌ MISSING";
$configSecretStatus = $configClientSecret ? "✅ SET (hidden for security)" : "❌ MISSING";
$configRedirectStatus = $configRedirectUri ? "✅ SET: $configRedirectUri" : "❌ MISSING";

echo "   services.google.client_id: $configIdStatus\n";
echo "   services.google.client_secret: $configSecretStatus\n";
echo "   services.google.redirect: $configRedirectStatus\n\n";

// 3. Propose correct redirect URI based on APP_URL
$appUrl = env('APP_URL', 'http://localhost:8000');
$suggestedRedirectUri = rtrim($appUrl, '/') . '/google/callback';
echo "3. Recommended Configuration:\n";
echo "   Based on your APP_URL ({$appUrl}), your Google redirect URI should be:\n";
echo "   $suggestedRedirectUri\n\n";

// 4. Display Google Cloud Console instructions
echo "4. Google Cloud Console Configuration:\n";
echo "   Please ensure your OAuth 2.0 Client ID has the following settings in Google Cloud Console:\n";
echo "   - Application type: Web application\n";
echo "   - Authorized JavaScript origins: $appUrl\n";
echo "   - Authorized redirect URIs: $suggestedRedirectUri\n\n";
echo "   You can configure these at: https://console.cloud.google.com/apis/credentials\n\n";

// 5. Interactive setup
echo "5. Would you like to update your .env file with the correct Google OAuth settings? (y/n): ";
$handle = fopen("php://stdin", "r");
$line = trim(fgets($handle));
if (strtolower($line) !== 'y') {
    echo "\nNo changes made to your .env file.\n";
    exit;
}

echo "\nPlease enter your Google OAuth credentials:\n";

echo "Google Client ID (leave blank to keep current): ";
$inputClientId = trim(fgets($handle));
$clientId = !empty($inputClientId) ? $inputClientId : $clientId;

echo "Google Client Secret (leave blank to keep current): ";
$inputClientSecret = trim(fgets($handle));
$clientSecret = !empty($inputClientSecret) ? $inputClientSecret : $clientSecret;

echo "Use recommended redirect URI ($suggestedRedirectUri)? (y/n): ";
$useRecommended = strtolower(trim(fgets($handle))) === 'y';
if ($useRecommended) {
    $redirectUri = $suggestedRedirectUri;
} else {
    echo "Google Redirect URI (leave blank to keep current): ";
    $inputRedirectUri = trim(fgets($handle));
    $redirectUri = !empty($inputRedirectUri) ? $inputRedirectUri : $redirectUri;
}

fclose($handle);

// Update .env file
$updatedEnv = $envContent;

// Helper function to update/add variable
function updateEnvVar(&$content, $key, $value) {
    if (preg_match("/^{$key}=.*$/m", $content)) {
        // Update existing variable
        $content = preg_replace("/^{$key}=.*$/m", "{$key}={$value}", $content);
    } else {
        // Add new variable
        $content .= "\n{$key}={$value}";
    }
}

// Update the variables
if ($clientId) updateEnvVar($updatedEnv, 'GOOGLE_CLIENT_ID', $clientId);
if ($clientSecret) updateEnvVar($updatedEnv, 'GOOGLE_CLIENT_SECRET', $clientSecret);
if ($redirectUri) updateEnvVar($updatedEnv, 'GOOGLE_REDIRECT_URI', $redirectUri);

// Make SSL verification configurable for development
if (!isset($existingVars['GOOGLE_API_VERIFY_SSL'])) {
    echo "\nGoogle API SSL Verification:\n";
    echo "For production, SSL verification should be enabled.\n";
    echo "For local development, you might need to disable it if using self-signed certificates.\n";
    echo "Disable SSL verification? (Only do this for local development) (y/n): ";

    $handle = fopen("php://stdin", "r");
    $disableSSL = strtolower(trim(fgets($handle))) === 'y';
    fclose($handle);

    updateEnvVar($updatedEnv, 'GOOGLE_API_VERIFY_SSL', $disableSSL ? 'false' : 'true');
}

// Write updated content back to .env file
file_put_contents($envPath, $updatedEnv);

echo "\nYour .env file has been updated with Google OAuth settings.\n";
echo "Please restart your application if it's currently running.\n\n";
echo "Verify your Google Cloud Console settings at: https://console.cloud.google.com/apis/credentials\n";
echo "Ensure the authorized redirect URI is set to: $redirectUri\n";
