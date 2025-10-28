<?php

echo "Updating .env file with OpenRouter API key\n";

// Read the current .env file
$envFile = __DIR__ . '/.env';
$envContent = file_get_contents($envFile);

if ($envContent === false) {
    echo "Error: Could not read .env file\n";
    exit(1);
}

// Check if OpenRouter API key already exists
if (preg_match('/OPENROUTER_API_KEY=(.*)/', $envContent)) {
    // Update existing key
    $envContent = preg_replace(
        '/OPENROUTER_API_KEY=.*/',
        'OPENROUTER_API_KEY=your_api_key_here',
        $envContent
    );
} else {
    // Add key if it doesn't exist
    $envContent .= "\n\n# OpenRouter API Configuration\nOPENROUTER_API_KEY=your_api_key_here\nOPENROUTER_MODEL=mistralai/mistral-7b-instruct\nOPENROUTER_VERIFY_SSL=false\n";
}

// Write back to .env file
if (file_put_contents($envFile, $envContent) === false) {
    echo "Error: Could not write to .env file\n";
    exit(1);
}

echo "Successfully updated .env file\n";
echo "Please replace 'your_api_key_here' with your actual OpenRouter API key\n";
