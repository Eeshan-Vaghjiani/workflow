<?php
// fix_google_connection.php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\GoogleCalendar;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

echo "Starting Google Calendar connection fix script...\n";

// Check if the google_calendars table exists
if (!Schema::hasTable('google_calendars')) {
    echo "Error: The 'google_calendars' table does not exist. Please run migrations first.\n";
    exit;
}

// Check table structure
echo "Checking google_calendars table structure...\n";
$columns = Schema::getColumnListing('google_calendars');
echo "Columns found: " . implode(', ', $columns) . "\n";

// Get the first user (adjust as needed)
$user = User::first();
if (!$user) {
    echo "No user found. Please make sure you have at least one user in your database.\n";
    exit;
}

echo "Found user: {$user->id} ({$user->name} - {$user->email})\n";

// Check if a record already exists
$existing = GoogleCalendar::where('user_id', $user->id)->first();
if ($existing) {
    echo "A Google Calendar connection already exists for user {$user->id}.\n";
    echo "Deleting and creating a new one...\n";
    $existing->delete();
}

// Load credentials from .env file
$clientId = env('GOOGLE_CLIENT_ID');
$clientSecret = env('GOOGLE_CLIENT_SECRET');
$redirectUri = env('GOOGLE_REDIRECT_URI');

echo "Google Client ID: " . (empty($clientId) ? "NOT SET" : substr($clientId, 0, 5) . '...') . "\n";
echo "Google Client Secret: " . (empty($clientSecret) ? "NOT SET" : "PRESENT") . "\n";
echo "Google Redirect URI: " . (empty($redirectUri) ? "NOT SET" : $redirectUri) . "\n";

// Create a new record
try {
    // Try raw DB insert first
    echo "Attempting to insert record using DB facade...\n";

    $inserted = DB::table('google_calendars')->insert([
        'user_id' => $user->id,
        'access_token' => 'temporary_access_token_for_testing',
        'refresh_token' => 'temporary_refresh_token_for_testing',
        'token_expires_at' => Carbon::now()->addHour(),
        'calendar_id' => 'primary',
        'created_at' => Carbon::now(),
        'updated_at' => Carbon::now()
    ]);

    if ($inserted) {
        echo "Successfully inserted Google Calendar connection for user {$user->id} using DB facade!\n";
    } else {
        echo "DB insert failed, trying Eloquent model...\n";

        // Try with Eloquent model
        $calendar = new GoogleCalendar([
            'user_id' => $user->id,
            'access_token' => 'temporary_access_token_for_testing',
            'refresh_token' => 'temporary_refresh_token_for_testing',
            'token_expires_at' => Carbon::now()->addHour(),
            'calendar_id' => 'primary'
        ]);

        $saved = $calendar->save();

        if ($saved) {
            echo "Successfully created Google Calendar connection for user {$user->id} using Eloquent!\n";
        } else {
            echo "Error: Failed to save Google Calendar connection using Eloquent model.\n";
        }
    }

    // Verify the connection exists
    $connection = GoogleCalendar::where('user_id', $user->id)->first();
    if ($connection) {
        echo "Verification: Google Calendar connection exists in database.\n";
    } else {
        echo "Verification failed: No Google Calendar connection found after insert.\n";
    }

} catch (Exception $e) {
    echo "Error creating Google Calendar connection: " . $e->getMessage() . "\n";
    echo "Error type: " . get_class($e) . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "\nScript completed. Please refresh your Calendar Settings page to check if connection is now recognized.\n";
echo "If it shows connected but with temporary tokens, click 'Reconnect Calendar' to get proper OAuth tokens.\n";
