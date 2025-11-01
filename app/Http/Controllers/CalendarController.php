<?php

namespace App\Http\Controllers;

use App\Models\GroupTask;
use App\Models\Assignment;
use App\Models\GroupAssignment;
use App\Models\Group;
use App\Models\GoogleCalendar;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CalendarController extends Controller
{
    /**
     * Display the calendar view.
     */
    public function index()
    {
        $user = Auth::user();

        // Get all tasks for the user
        $tasks = GroupTask::where('assigned_user_id', $user->id)
            ->with(['assignment'])
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'start' => $task->start_date,
                    'end' => $task->end_date,
                    'allDay' => true,
                    'backgroundColor' => $this->getPriorityColor($task->priority),
                    'borderColor' => $this->getPriorityColor($task->priority),
                    'textColor' => '#ffffff',
                    'priority' => $task->priority,
                    'status' => $task->status,
                    'assignmentTitle' => $task->assignment?->title,
                ];
            });

        // Get all assignments for the user's groups
        $assignments = Assignment::whereHas('groups', function ($query) use ($user) {
            $query->whereHas('users', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            });
        })
        ->get()
        ->map(function ($assignment) {
            return [
                'id' => 'assignment_' . $assignment->id,
                'title' => $assignment->title,
                'start' => $assignment->start_date,
                'end' => $assignment->end_date,
                'allDay' => true,
                'backgroundColor' => '#4f46e5', // Indigo color for assignments
                'borderColor' => '#4f46e5',
                'textColor' => '#ffffff',
                'assignmentTitle' => $assignment->title,
            ];
        });

        // Combine tasks and assignments
        $events = $tasks->concat($assignments);

        return Inertia::render('Calendar/Index', [
            'events' => $events,
        ]);
    }

    /**
     * Sync tasks to Google Calendar.
     */
    public function sync()
    {
        $user = Auth::user();

        // Add detailed logging
        Log::info('Calendar sync requested', [
            'user_id' => $user->id
        ]);

        // Check if user has Google Calendar connected
        $googleCalendar = GoogleCalendar::where('user_id', $user->id)->first();

        if (!$googleCalendar) {
            Log::warning('Google Calendar sync failed - not connected', [
                'user_id' => $user->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Google Calendar not connected',
                'error_code' => 'calendar_not_connected'
            ], 400);
        }

        // Validate calendar ID
        if (empty($googleCalendar->calendar_id)) {
            Log::warning('Google Calendar sync failed - no calendar ID', [
                'user_id' => $user->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'No calendar ID specified. Please go to Calendar Settings and enter your Google Calendar ID.',
                'error_code' => 'missing_calendar_id'
            ], 400);
        }

        try {
            // Get all tasks assigned to the user
            $tasks = GroupTask::where('assigned_user_id', $user->id)
                ->with('assignment')
                ->get();

            // Get all group assignments for the user's groups
            // Fix: Use GroupAssignment model instead of Assignment
            $groupAssignments = GroupAssignment::whereHas('group.members', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })->get();

            Log::info('Starting Google Calendar sync', [
                'user_id' => $user->id,
                'calendar_id' => $googleCalendar->calendar_id,
                'tasks_count' => $tasks->count(),
                'assignments_count' => $groupAssignments->count()
            ]);

            // Sync with Google Calendar
            $googleCalendar->syncEvents($tasks, $groupAssignments);

            Log::info('Calendar sync successful', [
                'user_id' => $user->id,
                'tasks_count' => $tasks->count(),
                'assignments_count' => $groupAssignments->count()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Calendar synced successfully',
                'data' => [
                    'tasks_count' => $tasks->count(),
                    'assignments_count' => $groupAssignments->count()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Calendar sync failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            $errorMessage = $e->getMessage();
            $errorCode = 'sync_failed';

            // Check for specific Google API errors
            if (strpos($errorMessage, 'invalid_grant') !== false) {
                $errorCode = 'token_revoked';
                $errorMessage = 'Your Google Calendar access has been revoked. Please reconnect your account.';
            } elseif (strpos($errorMessage, 'invalid_token') !== false) {
                $errorCode = 'invalid_token';
                $errorMessage = 'Invalid Google Calendar token. Please reconnect your account.';
            } elseif (strpos($errorMessage, 'access_denied') !== false) {
                $errorCode = 'access_denied';
                $errorMessage = 'Access to your Google Calendar was denied. Please check your permissions.';
            } elseif (strpos($errorMessage, 'Not Found') !== false || strpos($errorMessage, '404') !== false) {
                $errorCode = 'calendar_not_found';
                $errorMessage = 'Calendar ID not found. Please check your Calendar ID in the Calendar Settings page.';
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to sync calendar: ' . $errorMessage,
                'error_code' => $errorCode
            ], 500);
        }
    }

    private function getPriorityColor($priority)
    {
        return match ($priority) {
            'high' => '#ef4444', // Red
            'medium' => '#f59e0b', // Amber
            'low' => '#10b981', // Emerald
            default => '#6b7280', // Gray
        };
    }
}
