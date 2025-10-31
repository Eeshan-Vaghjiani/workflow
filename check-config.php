#!/usr/bin/env php
<?php

/**
 * Quick Configuration Checker
 * Run this to verify your WorkOS and app configuration
 */

echo "=== Configuration Checker ===\n\n";

// Check if we're in the right directory
if (!file_exists('artisan')) {
    echo "❌ Error: Please run this script from your Laravel project root\n";
    exit(1);
}

// Load Laravel
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "✅ Laravel loaded successfully\n\n";

// Check APP_URL
echo "--- APP Configuration ---\n";
$appUrl = config('app.url');
echo "APP_URL: " . ($appUrl ?: '❌ NOT SET') . "\n";
if ($appUrl !== 'https://app.dhruvinbhudia.me') {
    echo "⚠️  WARNING: APP_URL should be 'https://app.dhruvinbhudia.me'\n";
}
echo "\n";

// Check WorkOS Configuration
echo "--- WorkOS Configuration ---\n";
$workosClientId = config('workos.client_id');
$workosApiKey = config('workos.api_key');
$workosRedirectUri = config('workos.redirect_uri');

echo "WORKOS_CLIENT_ID: " . ($workosClientId ? '✅ SET (' . substr($workosClientId, 0, 10) . '...)' : '❌ NOT SET') . "\n";
echo "WORKOS_API_KEY: " . ($workosApiKey ? '✅ SET (' . substr($workosApiKey, 0, 10) . '...)' : '❌ NOT SET') . "\n";
echo "WORKOS_REDIRECT_URI: " . ($workosRedirectUri ?: '❌ NOT SET') . "\n";

if ($workosRedirectUri) {
    if (str_contains($workosRedirectUri, '/authenticate')) {
        echo "✅ Redirect URI uses '/authenticate' (CORRECT)\n";
    } elseif (str_contains($workosRedirectUri, '/workos-callback')) {
        echo "❌ ERROR: Redirect URI uses '/workos-callback' (WRONG!)\n";
        echo "   Change it to: https://app.dhruvinbhudia.me/authenticate\n";
    } else {
        echo "⚠️  WARNING: Unexpected redirect URI format\n";
    }
}
echo "\n";

// Check routes
echo "--- Routes Check ---\n";
try {
    $routes = app('router')->getRoutes();
    $loginRoute = $routes->getByName('login');
    $authenticateRoute = $routes->getByName('authenticate');
    
    if ($loginRoute) {
        echo "✅ Login route exists: " . $loginRoute->uri() . "\n";
    } else {
        echo "❌ Login route NOT FOUND\n";
    }
    
    if ($authenticateRoute) {
        echo "✅ Authenticate route exists: " . $authenticateRoute->uri() . "\n";
    } else {
        echo "❌ Authenticate route NOT FOUND\n";
    }
} catch (\Exception $e) {
    echo "❌ Error checking routes: " . $e->getMessage() . "\n";
}
echo "\n";

// Check build files
echo "--- Build Files Check ---\n";
$buildPath = public_path('build');
if (file_exists($buildPath)) {
    echo "✅ Build directory exists\n";
    
    $manifestPath = $buildPath . '/manifest.json';
    if (file_exists($manifestPath)) {
        echo "✅ Manifest file exists\n";
        $manifest = json_decode(file_get_contents($manifestPath), true);
        if (isset($manifest['resources/css/app.css'])) {
            echo "✅ CSS file in manifest: " . $manifest['resources/css/app.css']['file'] . "\n";
            
            $cssFile = $buildPath . '/' . $manifest['resources/css/app.css']['file'];
            if (file_exists($cssFile)) {
                echo "✅ CSS file exists on disk\n";
                $cssSize = filesize($cssFile);
                echo "   Size: " . number_format($cssSize) . " bytes\n";
            } else {
                echo "❌ CSS file NOT FOUND on disk\n";
            }
        } else {
            echo "❌ CSS file NOT in manifest\n";
        }
    } else {
        echo "❌ Manifest file NOT FOUND\n";
    }
} else {
    echo "❌ Build directory NOT FOUND\n";
    echo "   Run: npm run build\n";
}
echo "\n";

// Summary
echo "=== Summary ===\n";
$issues = [];

if ($appUrl !== 'https://app.dhruvinbhudia.me') {
    $issues[] = "Update APP_URL in .env";
}
if (!$workosClientId) {
    $issues[] = "Set WORKOS_CLIENT_ID in .env";
}
if (!$workosApiKey) {
    $issues[] = "Set WORKOS_API_KEY in .env";
}
if (!$workosRedirectUri || !str_contains($workosRedirectUri, '/authenticate')) {
    $issues[] = "Set WORKOS_REDIRECT_URI=https://app.dhruvinbhudia.me/authenticate in .env";
    $issues[] = "Update WorkOS dashboard to use /authenticate as default redirect";
}
if (!file_exists($buildPath)) {
    $issues[] = "Run: npm run build";
}

if (empty($issues)) {
    echo "✅ All checks passed! Configuration looks good.\n";
    echo "\nNext steps:\n";
    echo "1. Make sure WorkOS dashboard has /authenticate as default redirect URI\n";
    echo "2. Clear cache: php artisan config:clear\n";
    echo "3. Test login at: https://app.dhruvinbhudia.me/login\n";
} else {
    echo "❌ Issues found:\n";
    foreach ($issues as $i => $issue) {
        echo ($i + 1) . ". " . $issue . "\n";
    }
}

echo "\n";
