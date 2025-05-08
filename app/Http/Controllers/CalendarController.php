<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Assignment;
use App\Models\Group;
use App\Models\GoogleCalendar;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class CalendarController extends Controller
{
    /**
     * Display the calendar view.
     */
    public function index()
    {
        $user = auth()->user();
        
        // Get all tasks for the user
        $tasks = Task::where('user_id', $user->id)
            ->with(['assignment', 'group'])
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
                    'progress' => $task->progress,
                    'groupName' => $task->group?->name,
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
        $user = auth()->user();
        
        // Check if user has Google Calendar connected
        $googleCalendar = GoogleCalendar::where('user_id', $user->id)->first();
        
        if (!$googleCalendar) {
            return response()->json([
                'message' => 'Google Calendar not connected'
            ], 400);
        }
        
        // Get all tasks and assignments
        $tasks = Task::where('user_id', $user->id)
            ->with(['assignment', 'group'])
            ->get();
            
        $assignments = Assignment::whereHas('groups', function ($query) use ($user) {
            $query->whereHas('users', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            });
        })->get();
        
        // Sync with Google Calendar
        try {
            $googleCalendar->syncEvents($tasks, $assignments);
            
            return response()->json([
                'message' => 'Calendar synced successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to sync calendar: ' . $e->getMessage()
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