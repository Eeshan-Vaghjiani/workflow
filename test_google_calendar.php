<?php
/**
 * Google Calendar Integration Test Script
 *
 * This script checks if the Google Calendar integration works correctly
 * by testing various API endpoints and functions.
 *
 * Run with: php test_google_calendar.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\GoogleCalendar;
use App\Models\User;
use App\Models\GroupTask;

echo "========================================\n";
echo "Google Calendar Integration Test\n";
echo "========================================\n\n";

// Check for command line arguments
$userId = $argv[1] ?? null;
if (!$userId) {
    echo "\033[31mError: Please provide a user ID as an argument.\033[0m\n";
    echo "Usage: php test_google_calendar.php {user_id}\n\n";
    exit(1);
}

// Find the user
$user = User::find($userId);
if (!$user) {
    echo "\033[31mError: User with ID $userId not found.\033[0m\n\n";
    exit(1);
}

// Log in as the user
Auth::login($user);
echo "Logged in as: {$user->name} (ID: {$user->id})\n\n";

// Check if the user has a Google Calendar connection
$googleCalendar = GoogleCalendar::where('user_id', $user->id)->first();
if (!$googleCalendar) {
    echo "\033[31mError: This user has not connected their Google Calendar.\033[0m\n";
    echo "The user must connect their Google Calendar before running this test.\n\n";
    exit(1);
}

echo "Google Calendar connection found:\n";
echo "- Created at: " . $googleCalendar->created_at . "\n";
echo "- Expires at: " . ($googleCalendar->token_expires_at ?? 'Unknown') . "\n";

// Check for calendar_id
if (empty($googleCalendar->calendar_id)) {
    echo "\033[33mWarning: No calendar_id set for this user.\033[0m\n";
    echo "The calendar_id is required for syncing. Would you like to set it now? (y/n): ";
    $handle = fopen("php://stdin", "r");
    $line = trim(fgets($handle));
    if (strtolower($line) === 'y') {
        echo "Enter calendar ID (use 'primary' for the primary calendar): ";
        $calendarId = trim(fgets($handle));

        $googleCalendar->calendar_id = $calendarId;
        $googleCalendar->save();

        echo "\033[32mCalendar ID set to: $calendarId\033[0m\n\n";
    } else {
        echo "Continuing without setting a calendar ID...\n\n";
    }
} else {
    echo "- Calendar ID: " . $googleCalendar->calendar_id . "\n\n";
}

// Count user's tasks and assignments
$tasksCount = GroupTask::where('assigned_user_id', $user->id)->count();
echo "User has $tasksCount tasks that can be synced.\n\n";

// Test calendar sync
echo "Testing calendar sync...\n";
try {
    // Create an instance of the CalendarController
    $controller = app()->make(\App\Http\Controllers\CalendarController::class);

    // Call the sync method and get the response
    $response = $controller->sync();

    if ($response->getStatusCode() === 200) {
        $data = json_decode($response->getContent(), true);
        echo "\033[32mSync successful!\033[0m\n";
        echo "- Tasks synced: " . $data['data']['tasks_count'] . "\n";
        echo "- Assignments synced: " . $data['data']['assignments_count'] . "\n";
    } else {
        $data = json_decode($response->getContent(), true);
        echo "\033[31mSync failed with status code: " . $response->getStatusCode() . "\033[0m\n";
        echo "- Error: " . ($data['message'] ?? 'Unknown error') . "\n";
        echo "- Error code: " . ($data['error_code'] ?? 'Unknown') . "\n";
    }
} catch (\Exception $e) {
    echo "\033[31mException during sync:\033[0m\n";
    echo "- Error: " . $e->getMessage() . "\n";
    echo "- File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\n========================================\n";
echo "Test completed\n";
echo "========================================\n";
