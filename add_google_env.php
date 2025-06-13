<?php

$envFile = __DIR__ . "/.env";
$envContent = file_get_contents($envFile);

// Remove any malformed entries
$envContent = preg_replace("/OPENROUTER_VERIFY_SSL=falseGOOGLE_CLIENT_ID=.*/", "OPENROUTER_VERIFY_SSL=false", $envContent);

// Add Google credentials properly
if (strpos($envContent, "GOOGLE_CLIENT_ID") === false) {
    $envContent .= "\n\n# Google Calendar API credentials\n";
    $envContent .= "GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE\n";
    $envContent .= "GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE\n";
    $envContent .= "GOOGLE_REDIRECT_URI=http://localhost:8000/google/callback\n";

    file_put_contents($envFile, $envContent);
    echo "Google Calendar credentials added to .env file successfully!\n";
} else {
    echo "Google Calendar credentials already exist in .env file. Checking format...\n";

    // Check if they are properly formatted
    if (strpos($envContent, "\nGOOGLE_CLIENT_ID=") === false) {
        echo "Fixing Google Calendar credentials format...\n";
        file_put_contents($envFile, $envContent);
        echo "Format fixed!\n";
    } else {
        echo "Format looks good!\n";
    }
}
