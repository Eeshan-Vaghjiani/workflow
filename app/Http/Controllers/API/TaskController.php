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
} 