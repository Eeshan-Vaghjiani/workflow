<?php

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load Laravel environment variables
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Use the AIService for the test
use App\Services\AIService;

echo "Testing OpenRouter API connection...\n";

// Create the AIService
$aiService = new AIService();

// Test connection
$result = $aiService->testConnection();

echo "Connection test result: \n";
print_r($result);

// Try to get the working model
echo "\nTrying to get working model...\n";
$workingModel = $aiService->getWorkingModel();
echo "Working model: " . $workingModel . "\n";

// Exit the script
exit(0);
