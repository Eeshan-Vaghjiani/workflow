<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\GroupTask;
use App\Models\GroupAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller
{
    /**
     * Get all tasks for the authenticated user
     */
    public function index()
    {
        $user = Auth::user();

        $tasks = GroupTask::whereHas('assignment.group.members', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->with(['assignment', 'assignment.group', 'assigned_user'])
        ->get();

        return response()->json($tasks);
    }

    /**
     * Store a newly created task
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'assignment_id' => 'required|exists:group_assignments,id',
            'assigned_to' => 'nullable|exists:users,id',
            'priority' => 'nullable|in:low,medium,high',
        ]);

        $assignment = GroupAssignment::findOrFail($validated['assignment_id']);

        // Check if user is a member of the group
        if (!$assignment->group->members()->where('user_id', Auth::id())->exists()) {
            return response()->json(['message' => 'You are not a member of this group'], 403);
        }

        // Check if the user is authorized to create tasks
        if (!$assignment->group->isLeader(Auth::id())) {
            return response()->json(['message' => 'You are not authorized to create tasks for this assignment'], 403);
        }

        $task = GroupTask::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'assignment_id' => $validated['assignment_id'],
            'assigned_to' => $validated['assigned_to'] ?? Auth::id(),
            'status' => 'not_started',
            'priority' => $validated['priority'] ?? 'medium',
        ]);

        // Load relationships
        $task->load(['assignment', 'assignment.group', 'assignedUser']);

        return response()->json($task, 201);
    }

    /**
     * Update the specified task
     */
    public function update(Request $request, $id)
    {
        $task = GroupTask::findOrFail($id);

        // Load relationships
        $task->load(['assignment', 'assignment.group']);

        // Check if user is a member of the group
        if (!$task->assignment->group->members()->where('user_id', Auth::id())->exists()) {
            return response()->json(['message' => 'You are not a member of this group'], 403);
        }

        // Validate request data
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string|max:1000',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date',
            'assigned_to' => 'sometimes|nullable|exists:users,id',
            'status' => 'sometimes|in:not_started,in_progress,completed',
            'priority' => 'sometimes|in:low,medium,high',
            'progress' => 'sometimes|numeric|min:0|max:100',
        ]);

        // Update the status based on progress if provided
        if (isset($validated['progress'])) {
            if ($validated['progress'] >= 100) {
                $validated['status'] = 'completed';
            } elseif ($validated['progress'] > 0) {
                $validated['status'] = 'in_progress';
            } else {
                $validated['status'] = 'not_started';
            }
        }

        // Update the task
        $task->update($validated);

        // Reload relationships
        $task->load(['assignment', 'assignment.group', 'assignedUser']);

        return response()->json($task);
    }

    /**
     * Remove the specified task
     */
    public function destroy($id)
    {
        $task = GroupTask::findOrFail($id);

        // Load relationships
        $task->load(['assignment', 'assignment.group']);

        // Check if user is a member of the group and a leader
        if (!$task->assignment->group->isLeader(Auth::id())) {
            return response()->json(['message' => 'You are not authorized to delete this task'], 403);
        }

        $task->delete();

        return response()->json(['message' => 'Task deleted successfully']);
    }

    /**
     * Update the task dates (for calendar integration).
     */
    public function updateDates(Request $request, $id)
    {
        try {
            $task = \App\Models\GroupTask::find($id);

            if (!$task) {
                return response()->json([
                    'success' => false,
                    'message' => 'Task not found'
                ], 404);
            }

            // Check if user has permission to update this task
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated'
                ], 401);
            }

            // Check if the user is a member of the group this task belongs to
            if (!$task->assignment || !$task->assignment->group) {
                return response()->json([
                    'success' => false,
                    'message' => 'Task has invalid assignment or group'
                ], 422);
            }

            $isGroupMember = $task->assignment->group->members()->where('user_id', $user->id)->exists();

            if (!$isGroupMember) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to update this task'
                ], 403);
            }

            // Log request for debugging
            \Illuminate\Support\Facades\Log::info('Calendar task update request', [
                'task_id' => $id,
                'user_id' => $user->id,
                'request_data' => $request->all()
            ]);

            // Validate input with more flexible validation
            $validated = $request->validate([
                'start_date' => 'required|date',
                'end_date' => 'required|date',
            ]);

            // Ensure end date is not before start date
            $startDate = new \DateTime($validated['start_date']);
            $endDate = new \DateTime($validated['end_date']);

            if ($endDate < $startDate) {
                $endDate = clone $startDate;
                $validated['end_date'] = $validated['start_date'];
            }

            // Update the task
            $task->start_date = $validated['start_date'];
            $task->end_date = $validated['end_date'];
            $task->save();

            // Sync with Google Calendar if connected
            $googleCalendarSynced = false;

            try {
                $googleCalendar = \App\Models\GoogleCalendar::where('user_id', $user->id)->first();
                if ($googleCalendar) {
                    \Illuminate\Support\Facades\Log::info('Attempting to sync task to Google Calendar', [
                        'task_id' => $task->id,
                        'calendar_id' => $googleCalendar->calendar_id
                    ]);

                    // Add code to sync this specific task to Google Calendar
                    $googleCalendar->syncSingleTask($task);

                    \Illuminate\Support\Facades\Log::info('Successfully synced task to Google Calendar', [
                        'task_id' => $task->id
                    ]);

                    $googleCalendarSynced = true;
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to sync task to Google Calendar', [
                    'task_id' => $task->id,
                    'error' => $e->getMessage()
                ]);
                // Don't fail the whole request if Google sync fails
            }

            // Log the update
            \Illuminate\Support\Facades\Log::info('Task dates updated via calendar', [
                'task_id' => $task->id,
                'user_id' => $user->id,
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'google_sync' => $googleCalendarSynced
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Task dates updated successfully',
                'google_sync' => $googleCalendarSynced,
                'task' => $task
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::warning('Task date validation error', [
                'task_id' => $id ?? null,
                'errors' => $e->errors()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error updating task dates', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'task_id' => $id ?? null
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage()
            ], 500);
        }
    }
}
