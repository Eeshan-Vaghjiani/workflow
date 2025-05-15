<?php

namespace App\Http\Controllers;

use App\Models\GroupTask;
use App\Models\GroupAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GroupTaskController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $tasksQuery = GroupTask::query()
            ->with(['assignment.group', 'assignedUser'])
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
                ->where('is_leader', true);
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
            'assigned_to' => 'nullable|exists:users,id',
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
            'assigned_to' => $validated['assigned_to'] ?? auth()->id(),
            'status' => 'pending',
            'priority' => 'medium',
        ]);

        return redirect()->route('group-tasks.show', [
            'group' => $task->assignment->group_id,
            'assignment' => $task->assignment_id,
            'task' => $task->id
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(GroupTask $groupTask)
    {
        // Load the task with its relationships to ensure they exist
        $groupTask->load(['assignment.group', 'assignedUser']);

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
    public function update(Request $request, GroupTask $groupTask)
    {
        if (!$groupTask->assignment->group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to update this task');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'end_date' => 'required|date',
            'assigned_to' => 'nullable|exists:users,id',
            'status' => 'nullable|in:pending,completed',
        ]);

        $groupTask->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'end_date' => $validated['end_date'],
            'assigned_to' => $validated['assigned_to'] ?? null,
            'status' => $validated['status'] ?? $groupTask->status,
        ]);

        return redirect()->route('group-tasks.show', [
            'group' => $groupTask->assignment->group_id,
            'assignment' => $groupTask->assignment_id,
            'task' => $groupTask->id
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
     * Mark a task as complete.
     */
    public function complete(Request $request, GroupTask $groupTask)
    {
        $groupTask->load('assignment.group');

        if ($groupTask->assignment === null || $groupTask->assignment->group === null) {
            abort(404, 'Assignment or group not found');
        }

        // Either the task is assigned to the current user or they are a group leader
        if ($groupTask->assigned_to !== auth()->id() && !$groupTask->assignment->group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to mark this task as complete');
        }

        $groupTask->update([
            'status' => 'completed',
        ]);

        return back();
    }
}
