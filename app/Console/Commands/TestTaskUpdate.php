<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\GroupTask;
use App\Models\GoogleCalendar;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class TestTaskUpdate extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:task-update {task_id? : The ID of the task to update} {--debug : Enable debug output}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test task update functionality and Google Calendar sync';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Testing Task Update Functionality');
        $this->info('---------------------------------');

        $debug = $this->option('debug');
        $taskId = $this->argument('task_id');

        // Find a task if ID not provided
        if (!$taskId) {
            $task = GroupTask::latest()->first();
            if (!$task) {
                $this->error('No tasks found in the system');
                return 1;
            }
        } else {
            $task = GroupTask::find($taskId);
            if (!$task) {
                $this->error("Task with ID {$taskId} not found");
                return 1;
            }
        }

        $this->info("Using task: #{$task->id}: {$task->title}");

        // Print task details
        $this->table(
            ['Field', 'Value'],
            [
                ['ID', $task->id],
                ['Title', $task->title],
                ['Status', $task->status],
                ['Start Date', $task->start_date],
                ['End Date', $task->end_date],
                ['Assignment ID', $task->assignment_id],
                ['Assigned To', $task->assigned_user_id ?? 'Not assigned'],
            ]
        );

        // Test the calendar API endpoint
        try {
            // Get CSRF token - not needed for command line but included for reference
            $csrfResponse = Http::withOptions([
                'verify' => false,
            ])->get('http://localhost:8000/csrf-refresh');

            $csrfToken = $csrfResponse->successful() ? $csrfResponse->json('csrf_token') : 'no-csrf-token';

            if ($debug) {
                $this->info("Got CSRF token: " . substr($csrfToken, 0, 10) . '...');
            }

            // 1. Test updating via direct model update
            $this->info("\n1. Testing direct model update:");

            // Generate new dates (1 day later)
            $newStartDate = Carbon::parse($task->start_date)->addDay()->format('Y-m-d');
            $newEndDate = Carbon::parse($task->end_date)->addDay()->format('Y-m-d');

            $this->line("  Updating task dates: " . $task->start_date->format('Y-m-d') . " → {$newStartDate}, " . $task->end_date->format('Y-m-d') . " → {$newEndDate}");

            // Update task
            $oldStartDate = $task->start_date->format('Y-m-d');
            $oldEndDate = $task->end_date->format('Y-m-d');

            $task->start_date = $newStartDate;
            $task->end_date = $newEndDate;
            $task->save();

            // Verify update
            $task->refresh();
            if ($task->start_date->format('Y-m-d') === $newStartDate && $task->end_date->format('Y-m-d') === $newEndDate) {
                $this->info("  ✅ Direct update successful");
            } else {
                $this->error("  ❌ Direct update failed");
                $this->line("  Current dates: {$task->start_date->format('Y-m-d')}, {$task->end_date->format('Y-m-d')}");
            }

            // 2. Test API endpoint
            $this->info("\n2. Testing API endpoint:");

            // Generate new dates (2 days later from original)
            $apiStartDate = Carbon::parse($oldStartDate)->addDays(2)->format('Y-m-d');
            $apiEndDate = Carbon::parse($oldEndDate)->addDays(2)->format('Y-m-d');

            $this->line("  Updating task dates via API: " . $task->start_date->format('Y-m-d') . " → {$apiStartDate}, " . $task->end_date->format('Y-m-d') . " → {$apiEndDate}");

            // Call the API
            $response = Http::withOptions([
                'verify' => false,
            ])
            ->withHeaders([
                'X-CSRF-TOKEN' => $csrfToken,
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
                'X-Requested-With' => 'XMLHttpRequest',
            ])
            ->put("http://localhost:8000/api/tasks/{$task->id}", [
                'start_date' => $apiStartDate,
                'end_date' => $apiEndDate,
            ]);

            // Output the raw response for debugging
            if ($debug) {
                $this->line("\n  API Response:");
                $this->line(json_encode($response->json(), JSON_PRETTY_PRINT));
            }

            // Check response
            if ($response->successful()) {
                $this->info("  ✅ API update request successful");

                // Verify in database
                $task->refresh();
                if ($task->start_date->format('Y-m-d') === $apiStartDate && $task->end_date->format('Y-m-d') === $apiEndDate) {
                    $this->info("  ✅ Database verification successful");
                } else {
                    $this->error("  ❌ Database verification failed");
                    $this->line("  Current dates: {$task->start_date->format('Y-m-d')}, {$task->end_date->format('Y-m-d')}");
                    $this->line("  Expected: {$apiStartDate}, {$apiEndDate}");
                }
            } else {
                $this->error("  ❌ API update request failed with status {$response->status()}");
                $this->line("  Error: " . json_encode($response->json()));
            }

            // 3. Test Google Calendar sync
            $this->info("\n3. Testing Google Calendar sync:");

            // Find Google Calendar connection for task's assigned user
            $googleCalendar = null;
            if ($task->assigned_user_id) {
                $googleCalendar = GoogleCalendar::where('user_id', $task->assigned_user_id)->first();
            }

            if (!$googleCalendar) {
                $this->warn("  ⚠️ No Google Calendar connection found for the assigned user (ID: {$task->assigned_user_id})");

                // Try to find any Google Calendar connection
                $googleCalendar = GoogleCalendar::first();
                if ($googleCalendar) {
                    $this->line("  Using Google Calendar connection for user ID: {$googleCalendar->user_id}");
                } else {
                    $this->error("  ❌ No Google Calendar connections found in the system");
                    return 1;
                }
            }

            // Check Google Calendar credentials
            $this->line("  Google Calendar ID: {$googleCalendar->calendar_id}");
            $this->line("  Access token: " . (empty($googleCalendar->access_token) ? 'Missing' : 'Present'));
            $this->line("  Refresh token: " . (empty($googleCalendar->refresh_token) ? 'Missing' : 'Present'));

            if (empty($googleCalendar->access_token) || empty($googleCalendar->refresh_token)) {
                $this->error("  ❌ Google Calendar tokens missing");
                return 1;
            }

            // Check token expiration
            if ($googleCalendar->token_expires_at) {
                if ($googleCalendar->token_expires_at->isPast()) {
                    $this->line("  Token expired at {$googleCalendar->token_expires_at}, attempting refresh...");
                } else {
                    $this->line("  Token valid until {$googleCalendar->token_expires_at}");
                }
            } else {
                $this->warn("  ⚠️ Token expiration date not set");
            }

            // Test sync
            try {
                $googleCalendar->syncSingleTask($task);
                $this->info("  ✅ Google Calendar sync successful");
            } catch (\Exception $e) {
                $this->error("  ❌ Google Calendar sync failed: {$e->getMessage()}");
                if ($debug) {
                    $this->line("\n  Exception trace:");
                    $this->line($e->getTraceAsString());
                }
            }

            $this->info("\nAll tests completed!");

        } catch (\Exception $e) {
            $this->error("Error during testing: {$e->getMessage()}");
            if ($debug) {
                $this->line("\nException trace:");
                $this->line($e->getTraceAsString());
            }
            return 1;
        }

        return 0;
    }
}
