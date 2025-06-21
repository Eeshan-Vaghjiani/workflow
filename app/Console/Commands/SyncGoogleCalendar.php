<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\GoogleCalendar;
use App\Models\GroupTask;
use App\Models\GroupAssignment;
use Illuminate\Support\Facades\Log;

class SyncGoogleCalendar extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'calendar:sync {user_id?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync tasks and assignments to Google Calendar';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $userId = $this->argument('user_id');

        $query = GoogleCalendar::query();
        if ($userId) {
            $query->where('user_id', $userId);
        }

        $calendars = $query->get();

        if ($calendars->isEmpty()) {
            $this->error('No Google Calendar connections found.');
            return 1;
        }

        foreach ($calendars as $calendar) {
            try {
                $this->info("Syncing calendar for user {$calendar->user_id}...");

                // Get all tasks assigned to the user
                $tasks = GroupTask::where('assigned_user_id', $calendar->user_id)
                    ->with('assignment')
                    ->get();

                // Get all group assignments for the user's groups
                $groupAssignments = GroupAssignment::whereHas('group.members', function ($query) use ($calendar) {
                    $query->where('user_id', $calendar->user_id);
                })->get();

                $this->info("Found {$tasks->count()} tasks and {$groupAssignments->count()} assignments.");

                // Sync with Google Calendar
                $this->output->write("Syncing with Google Calendar... ");
                $result = $calendar->syncEvents($tasks, $groupAssignments);
                $this->output->writeln("Done!");

                // Display sync results if available
                if (is_array($result)) {
                    $this->info("Calendar sync completed for user {$calendar->user_id}:");
                    $this->line("  - Created/Updated: {$result['success_count']} items");
                    $this->line("  - Skipped (unchanged): {$result['skip_count']} items");
                    $this->line("  - Deleted: {$result['deleted_count']} items");

                    if ($result['failure_count'] > 0) {
                        $this->warn("  - Failed: {$result['failure_count']} items");
                    }
                } else {
                    $this->info("Calendar sync completed for user {$calendar->user_id}.");
                }
            } catch (\Exception $e) {
                $this->error("Error syncing calendar for user {$calendar->user_id}: {$e->getMessage()}");
                Log::error('Calendar sync command failed', [
                    'user_id' => $calendar->user_id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }

        return 0;
    }
}
