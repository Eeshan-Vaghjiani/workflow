<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     *
     * These cron jobs are run in the background by a process server.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule): void
    {
        // $schedule->command('inspire')->hourly();
        
        // Send notifications for assignments due within 24 hours
        $schedule->call(function () {
            $tomorrow = now()->addDay();
            $assignments = \App\Models\GroupAssignment::where('due_date', '>=', now())
                ->where('due_date', '<=', $tomorrow)
                ->get();
            
            $notificationService = new \App\Services\NotificationService();
            
            foreach ($assignments as $assignment) {
                $group = $assignment->group;
                foreach ($group->members as $member) {
                    $notificationService->createAssignmentDue($member, $assignment);
                }
            }
        })->dailyAt('9:00');
    }

    /**
     * Register the commands for the application.
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
} 