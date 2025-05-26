<?php

namespace App\Http\Controllers;

use App\Models\GroupTask;
use App\Models\GroupAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * @property int $id
 */
class GroupTaskController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $tasksQuery = GroupTask::query()
            ->with(['assignment.group', 'assigned_user'])
            ->whereHas('assignment.group.members', function ($query) {
                $query->where('user_id', auth()->id());
            })
            ->latest();

        $tasks = $tasksQuery->get();

        // Filter out tasks with null relationships
        $tasks = $tasks->filter(function ($task) {
            return $task->assignment !== null &&
                   $task->assignment->group !== null;
        });

        return Inertia::render('tasks/Index', [
            'tasks' => $tasks
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        $assignments = GroupAssignment::whereHas('group.members', function ($query) {
            $query->where('user_id', auth()->id())
                ->where('role', 'owner');
        })->with('group:id,name')->get();

        // Get the pre-selected assignment if provided
        $selectedAssignmentId = $request->query('assignment_id');

        return Inertia::render('tasks/Create', [
            'assignments' => $assignments,
            'selectedAssignmentId' => $selectedAssignmentId,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'end_date' => 'required|date',
            'assignment_id' => 'required|exists:group_assignments,id',
            'assigned_user_id' => 'nullable|exists:users,id',
            'effort_hours' => 'nullable|integer|min:1|max:100',
            'importance' => 'nullable|integer|min:1|max:5',
            'priority' => 'nullable|in:low,medium,high',
        ]);

        $assignment = GroupAssignment::findOrFail($validated['assignment_id']);

        if (!$assignment->group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to create tasks for this assignment');
        }

        $task = GroupTask::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'end_date' => $validated['end_date'],
            'start_date' => date('Y-m-d'),
            'assignment_id' => $validated['assignment_id'],
            'assigned_user_id' => $validated['assigned_user_id'] ?? auth()->id(),
            'status' => 'pending',
            'priority' => $validated['priority'] ?? 'medium',
            'effort_hours' => $validated['effort_hours'] ?? 1,
            'importance' => $validated['importance'] ?? 1,
            'created_by' => auth()->id(),
        ]);

        return redirect()->route('group-tasks.show', [
            'group' => $assignment->group_id,
            'assignment' => $validated['assignment_id'],
            'task' => $task->id
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(GroupTask $groupTask)
    {
        // Load the task with its relationships to ensure they exist
        $groupTask->load(['assignment.group', 'assigned_user']);

        if (!$groupTask->assignment || !$groupTask->assignment->group) {
            abort(404, 'Task, assignment or group not found');
        }

        if (!$groupTask->assignment->group->members()->where('user_id', auth()->id())->exists()) {
            abort(403, 'You are not a member of this group');
        }

        return Inertia::render('tasks/Show', [
            'task' => $groupTask
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(GroupTask $groupTask)
    {
        if (!$groupTask->assignment->group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to edit this task');
        }

        $groupMembers = $groupTask->assignment->group->members()->with('user')->get()->pluck('user');

        return Inertia::render('tasks/Edit', [
            'task' => $groupTask,
            'group_members' => $groupMembers
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, GroupTask $task)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|nullable|string',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'sometimes|required|date|after_or_equal:start_date',
            'status' => 'sometimes|required|in:pending,in_progress,completed',
            'priority' => 'sometimes|required|in:low,medium,high',
            'assigned_user_id' => 'sometimes|nullable|exists:users,id',
            'effort_hours' => 'sometimes|nullable|numeric|min:0',
            'importance' => 'sometimes|nullable|integer|min:1|max:5'
        ]);

        $task->update($validated);

        return response()->json([
            'message' => 'Task updated successfully',
            'task' => $task->load('assigned_user')
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(GroupTask $groupTask)
    {
        if (!$groupTask->assignment->group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to delete this task');
        }

        $groupTask->delete();

        return redirect()->route('group-tasks.index');
    }

    /**
     * Auto-distribute tasks for an assignment based on effort and importance.
     */
    public function autoDistributeTasksAPI(Request $request, $groupId, $assignmentId)
    {
        try {
            // Load the assignment
            $assignment = GroupAssignment::where('id', $assignmentId)
                ->where('group_id', $groupId)
                ->firstOrFail();

            // Check if user is authorized
            if (!$assignment->group->isLeader(auth()->id())) {
                return response()->json(['error' => 'You are not authorized to distribute tasks for this assignment'], 403);
            }

            $tasks = GroupTask::where('assignment_id', $assignmentId)->get()->toArray();

            // Get all group members
            $groupMembers = $assignment->group->members->map(function($member) {
                return [
                    'id' => $member->user->id,
                    'name' => $member->user->name
                ];
            })->toArray();

            // Use AI service to distribute tasks
            $aiService = app(\App\Services\AIService::class);
            $distributedTasks = $aiService->distributeTasks($tasks, $groupMembers);

            // Update tasks with new assignments
            foreach ($distributedTasks as $task) {
                if (isset($task['id']) && isset($task['assigned_user_id'])) {
                    GroupTask::where('id', $task['id'])->update(['assigned_user_id' => $task['assigned_user_id']]);
                }
            }

            // Return updated tasks
            $updatedTasks = GroupTask::where('assignment_id', $assignmentId)
                ->with('assigned_user:id,name')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Tasks have been distributed based on effort and importance',
                'tasks' => $updatedTasks
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to distribute tasks: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark a task as complete from a nested route (with group and assignment params).
     */
    public function complete(Request $request, $group, $assignment, GroupTask $task)
    {
        $task->load('assignment.group');

        if ($task->assignment === null || $task->assignment->group === null) {
            abort(404, 'Assignment or group not found');
        }

        // Either the task is assigned to the current user or they are a group leader
        if ($task->assigned_user_id !== auth()->id() && !$task->assignment->group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to mark this task as complete');
        }

        $task->update([
            'status' => 'completed',
        ]);

        return back();
    }

    /**
     * Mark a task as complete from the tasks list (simple route without group and assignment params).
     */
    public function completeSimple(GroupTask $task)
    {
        $task->load('assignment.group');

        if ($task->assignment === null || $task->assignment->group === null) {
            abort(404, 'Assignment or group not found');
        }

        // Either the task is assigned to the current user or they are a group leader
        if ($task->assigned_user_id !== auth()->id() && !$task->assignment->group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to mark this task as complete');
        }

        $task->update([
            'status' => 'completed',
        ]);

        return back();
    }

    /**
     * Update the specified resource directly without the nested route.
     */
    public function updateSimple(Request $request, GroupTask $task)
    {
        $task->load('assignment.group');

        if ($task->assignment === null || $task->assignment->group === null) {
            abort(404, 'Assignment or group not found');
        }

        if (!$task->assignment->group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to update this task');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'end_date' => 'required|date',
            'assigned_user_id' => 'nullable|exists:users,id',
            'status' => 'nullable|in:pending,completed',
            'effort_hours' => 'nullable|integer|min:1|max:100',
            'importance' => 'nullable|integer|min:1|max:5',
            'priority' => 'nullable|in:low,medium,high',
        ]);

        $task->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'end_date' => $validated['end_date'],
            'assigned_user_id' => $validated['assigned_user_id'] ?? null,
            'status' => $validated['status'] ?? $task->status,
            'effort_hours' => $validated['effort_hours'] ?? $task->effort_hours ?? 1,
            'importance' => $validated['importance'] ?? $task->importance ?? 3,
            'priority' => $validated['priority'] ?? $task->priority,
        ]);

        return redirect()->route('group-tasks.show', [
            'group' => $task->assignment->group_id,
            'assignment' => $task->assignment_id,
            'task' => $task->id
        ]);
    }

    /**
     * Display a kanban board view of tasks.
     */
    public function kanbanView(Request $request)
    {
        // Get all tasks assigned to the current user or from groups they're part of
        $user = auth()->user();

        // Query to get tasks either assigned to this user or from groups they're a member of
        $tasks = GroupTask::with(['assignment.group', 'assigned_user'])
            ->where(function($query) use ($user) {
                $query->where('assigned_user_id', $user->id)
                    ->orWhereHas('assignment.group.members', function($q) use ($user) {
                        $q->where('user_id', $user->id);
                    });
            })
            ->orderBy('end_date')
            ->get();

        // Optional: filter by group or assignment if provided in request
        $groupId = $request->input('group');
        $assignmentId = $request->input('assignment');

        if ($groupId) {
            $tasks = $tasks->filter(function($task) use ($groupId) {
                return $task->assignment && $task->assignment->group &&
                       $task->assignment->group->id == $groupId;
            });
        }

        if ($assignmentId) {
            $tasks = $tasks->where('assignment_id', $assignmentId);
        }

        return Inertia::render('tasks/KanbanView', [
            'tasks' => $tasks,
            'groupId' => $groupId,
            'assignmentId' => $assignmentId
        ]);
    }
}
