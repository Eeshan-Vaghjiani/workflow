<?php

namespace App\Http\Controllers;

use App\Models\GroupTask;
use App\Models\GroupAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

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
            ->with(['assignment.group', 'assigned_user']);

        // Default to showing only tasks assigned to the current user
        // Unless view_all is explicitly set to true
        if (!$request->has('view_all') || $request->view_all !== 'true') {
            $tasksQuery->where('assigned_user_id', Auth::id());
        } else {
            // If viewing all tasks, only show those from groups the user is a member of
            $tasksQuery->whereHas('assignment.group.members', function ($query) {
                $query->where('user_id', Auth::id());
            });
        }

        // Search functionality
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $tasksQuery->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by assignment
        if ($request->has('assignment_id') && !empty($request->assignment_id) && $request->assignment_id !== 'all') {
            $tasksQuery->where('assignment_id', $request->assignment_id);
        }

        // Filter by group (through assignment)
        if ($request->has('group_id') && !empty($request->group_id) && $request->group_id !== 'all') {
            $tasksQuery->whereHas('assignment', function($query) use ($request) {
                $query->where('group_id', $request->group_id);
            });
        }

        // Filter by status
        if ($request->has('status') && !empty($request->status) && $request->status !== 'all') {
            $tasksQuery->where('status', $request->status);
        }

        // Filter by priority
        if ($request->has('priority') && !empty($request->priority) && $request->priority !== 'all') {
            $tasksQuery->where('priority', $request->priority);
        }

        // Default sort by end_date (closest first)
        $sort = $request->input('sort', 'end_date');
        $direction = $request->input('direction', 'asc');

        // Validate sort field
        $validSortFields = ['end_date', 'title', 'created_at', 'status', 'priority', 'effort_hours'];
        if (!in_array($sort, $validSortFields)) {
            $sort = 'end_date';
        }

        // Validate direction
        if (!in_array($direction, ['asc', 'desc'])) {
            $direction = 'asc';
        }

        $tasksQuery->orderBy($sort, $direction);

        $tasks = $tasksQuery->get();

        // Filter out tasks with null relationships
        $tasks = $tasks->filter(function ($task) {
            return $task->assignment !== null &&
                   $task->assignment->group !== null;
        });

        // Get all assignments the user has access to
        $assignments = GroupAssignment::whereHas('group.members', function ($query) {
            $query->where('user_id', auth()->id());
        })->get(['id', 'title']);

        // Get all groups the user is a member of
        $userGroups = \App\Models\Group::whereHas('members', function($query) {
            $query->where('user_id', auth()->id());
        })->get(['id', 'name']);

        return Inertia::render('tasks/Index', [
            'tasks' => $tasks,
            'assignments' => $assignments,
            'userGroups' => $userGroups,
            'filters' => [
                'search' => $request->search,
                'assignment_id' => $request->assignment_id,
                'group_id' => $request->group_id,
                'status' => $request->status,
                'priority' => $request->priority,
                'sort' => $sort,
                'direction' => $direction,
                'view_all' => $request->view_all === 'true' ? 'true' : 'false'
            ]
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
        $assignment = GroupAssignment::findOrFail($request->assignment_id);
        $assignmentDueDate = $assignment->due_date ? $assignment->due_date->format('Y-m-d') : now()->addMonths(1)->format('Y-m-d');

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'end_date' => [
                'required',
                'date',
                'after_or_equal:' . now()->format('Y-m-d'),
                'before_or_equal:' . $assignmentDueDate
            ],
            'assignment_id' => 'required|exists:group_assignments,id',
            'assigned_user_id' => 'nullable|exists:users,id',
            'effort_hours' => 'nullable|integer|min:1|max:100',
            'importance' => 'nullable|integer|min:1|max:5',
            'priority' => 'nullable|in:low,medium,high',
        ], [
            'end_date.after_or_equal' => 'The due date must be today or in the future.',
            'end_date.before_or_equal' => 'The due date cannot be after the assignment due date (' . $assignmentDueDate . ').'
        ]);

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
            'assignment' => $assignment->id,
            'task' => $task->id
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show($group, $assignment, GroupTask $task)
    {
        // Load the task with its relationships to ensure they exist
        $task->load(['assignment.group', 'assigned_user']);

        if (!$task->assignment || !$task->assignment->group) {
            abort(404, 'Task, assignment or group not found');
        }

        // Verify the task belongs to the specified assignment and group
        if ($task->assignment->id != $assignment || $task->assignment->group->id != $group) {
            abort(404, 'Task does not belong to the specified assignment or group');
        }

        if (!$task->assignment->group->members()->where('user_id', auth()->id())->exists()) {
            abort(403, 'You are not a member of this group');
        }

        return Inertia::render('tasks/Show', [
            'task' => $task
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($group, $assignment, GroupTask $task)
    {
        if (!$task->assignment->group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to edit this task');
        }

        // Verify the task belongs to the specified assignment and group
        if ($task->assignment->id != $assignment || $task->assignment->group->id != $group) {
            abort(404, 'Task does not belong to the specified assignment or group');
        }

        $groupMembers = $task->assignment->group->members()->with('user')->get()->pluck('user');

        return Inertia::render('tasks/Edit', [
            'task' => $task,
            'group_members' => $groupMembers
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, GroupTask $task)
    {
        $task->load('assignment');
        $assignmentDueDate = $task->assignment->due_date ? $task->assignment->due_date->format('Y-m-d') : now()->addMonths(1)->format('Y-m-d');

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|nullable|string',
            'start_date' => 'sometimes|required|date',
            'end_date' => [
                'sometimes',
                'required',
                'date',
                'after_or_equal:' . now()->format('Y-m-d'),
                'before_or_equal:' . $assignmentDueDate
            ],
            'status' => 'sometimes|required|in:pending,in_progress,completed',
            'priority' => 'sometimes|required|in:low,medium,high',
            'assigned_user_id' => 'sometimes|nullable|exists:users,id',
            'effort_hours' => 'sometimes|nullable|numeric|min:0',
            'importance' => 'sometimes|nullable|integer|min:1|max:5'
        ], [
            'end_date.after_or_equal' => 'The due date must be today or in the future.',
            'end_date.before_or_equal' => 'The due date cannot be after the assignment due date (' . $assignmentDueDate . ').'
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
    public function destroy($group, $assignment, GroupTask $task)
    {
        if (!$task->assignment->group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to delete this task');
        }

        // Verify the task belongs to the specified assignment and group
        if ($task->assignment->id != $assignment || $task->assignment->group->id != $group) {
            abort(404, 'Task does not belong to the specified assignment or group');
        }

        $task->delete();

        return redirect()->route('group-assignments.show', [
            'group' => $group,
            'assignment' => $assignment
        ]);
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

            // Check if any tasks have due dates that are not valid
            $tasks = GroupTask::where('assignment_id', $assignmentId)->get();
            $assignmentDueDate = $assignment->due_date ? $assignment->due_date->format('Y-m-d') : null;
            $today = now()->format('Y-m-d');

            $invalidTasks = $tasks->filter(function($task) use ($assignmentDueDate, $today) {
                if (!$task->end_date) return false;

                $taskDueDate = $task->end_date->format('Y-m-d');
                return ($assignmentDueDate && $taskDueDate > $assignmentDueDate) || $taskDueDate < $today;
            });

            if ($invalidTasks->count() > 0) {
                $invalidTasksList = $invalidTasks->map(function($task) {
                    return $task->title;
                })->join(', ');

                return response()->json([
                    'success' => false,
                    'error' => 'Cannot auto-assign tasks because some tasks have invalid due dates. Please fix the following tasks: ' . $invalidTasksList
                ], 400);
            }

            // Get all group members - Direct SQL to avoid potential relationship issues
            $groupMembers = DB::table('users')
                ->join('group_user', 'users.id', '=', 'group_user.user_id')
                ->where('group_user.group_id', $groupId)
                ->select('users.id', 'users.name')
                ->get()
                ->map(function($member) {
                return [
                        'id' => $member->id,
                        'name' => $member->name
                ];
                })
                ->toArray();

            // Check if there are any valid members to distribute tasks to
            if (empty($groupMembers)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Cannot distribute tasks: No valid group members found'
                ], 400);
            }

            // Use AI service to distribute tasks
            $aiService = app(\App\Services\AIService::class);
            $distributedTasks = $aiService->distributeTasks($tasks->toArray(), $groupMembers);

            // Update tasks with new assignments, but preserve existing due dates
            foreach ($distributedTasks as $task) {
                if (isset($task['id']) && isset($task['assigned_user_id'])) {
                    // Only update the assigned_user_id field, not any date fields
                    GroupTask::where('id', $task['id'])->update([
                        'assigned_user_id' => $task['assigned_user_id']
                    ]);
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
            Log::error('Error in autoDistributeTasksAPI', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
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
            return Inertia::render('Error', [
                'status' => 404,
                'message' => 'Assignment or group not found'
            ])->toResponse(request())->setStatusCode(404);
        }

        // Either the task is assigned to the current user or they are a group leader
        if ($task->assigned_user_id !== auth()->id() && !$task->assignment->group->isLeader(auth()->id())) {
            return Inertia::render('Error', [
                'status' => 403,
                'message' => 'You are not authorized to mark this task as complete'
            ])->toResponse(request())->setStatusCode(403);
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
            return Inertia::render('Error', [
                'status' => 404,
                'message' => 'Assignment or group not found'
            ])->toResponse(request())->setStatusCode(404);
        }

        // Either the task is assigned to the current user or they are a group leader
        if ($task->assigned_user_id !== auth()->id() && !$task->assignment->group->isLeader(auth()->id())) {
            return Inertia::render('Error', [
                'status' => 403,
                'message' => 'You are not authorized to mark this task as complete'
            ])->toResponse(request())->setStatusCode(403);
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
            return Inertia::render('Error', [
                'status' => 404,
                'message' => 'Assignment or group not found'
            ])->toResponse(request())->setStatusCode(404);
        }

        if (!$task->assignment->group->isLeader(auth()->id())) {
            return Inertia::render('Error', [
                'status' => 403,
                'message' => 'You are not authorized to update this task'
            ])->toResponse(request())->setStatusCode(403);
        }

        $assignmentDueDate = $task->assignment->due_date ? $task->assignment->due_date->format('Y-m-d') : now()->addMonths(1)->format('Y-m-d');

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'end_date' => [
                'required',
                'date',
                'after_or_equal:' . now()->format('Y-m-d'),
                'before_or_equal:' . $assignmentDueDate
            ],
            'assigned_user_id' => 'nullable|exists:users,id',
            'status' => 'nullable|in:pending,completed',
            'effort_hours' => 'nullable|integer|min:1|max:100',
            'importance' => 'nullable|integer|min:1|max:5',
            'priority' => 'nullable|in:low,medium,high',
        ], [
            'end_date.after_or_equal' => 'The due date must be today or in the future.',
            'end_date.before_or_equal' => 'The due date cannot be after the assignment due date (' . $assignmentDueDate . ').'
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
