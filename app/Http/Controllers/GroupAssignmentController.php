<?php

namespace App\Http\Controllers;

use App\Models\GroupAssignment;
use App\Models\Group;
use Illuminate\Http\Request;
use Inertia\Inertia;

class your_generic_secretr extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request, Group $group = null)
    {
        // Start with a query that always includes group data
        $query = GroupAssignment::query()
            ->with(['group', 'tasks' => function($query) {
                $query->select('id', 'assignment_id'); // Only get the count
            }]);

        // Filter by group if one is provided
        if ($group) {
            if (!$group->members()->where('user_id', auth()->id())->exists()) {
                abort(403, 'You are not a member of this group');
            }

            $query->where('group_id', $group->id);
        } else {
            // If no group provided, show all assignments for the user
            $query->whereHas('group.members', function ($query) {
                $query->where('user_id', auth()->id());
            });
        }

        // Search functionality
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('unit_name', 'like', "%{$search}%");
            });
        }

        // Filter by group ID from query params
        if ($request->has('group_id') && !empty($request->group_id) && $request->group_id !== 'all') {
            $query->where('group_id', $request->group_id);
        }

        // Filter by status
        if ($request->has('status') && !empty($request->status) && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Default sort by due date (closest first)
        $sort = $request->input('sort', 'due_date');
        $direction = $request->input('direction', 'asc');

        // Validate sort field
        $validSortFields = ['due_date', 'title', 'created_at', 'unit_name'];
        if (!in_array($sort, $validSortFields)) {
            $sort = 'due_date';
        }

        // Validate direction
        if (!in_array($direction, ['asc', 'desc'])) {
            $direction = 'asc';
        }

        $query->orderBy($sort, $direction);

        $assignments = $query->get();

        // Filter out any assignments with null groups (shouldn't happen, but just in case)
        $assignments = $assignments->filter(function ($assignment) {
            return $assignment->group !== null;
        });

        // Get all groups the user is a member of for filtering
        $userGroups = \App\Models\Group::whereHas('members', function($query) {
            $query->where('user_id', auth()->id());
        })->get(['id', 'name']);

        return Inertia::render('Assignments/Index', [
            'assignments' => $assignments,
            'group' => $group,
            'userGroups' => $userGroups,
            'filters' => [
                'search' => $request->search,
                'group_id' => $request->group_id,
                'status' => $request->status,
                'sort' => $sort,
                'direction' => $direction
            ]
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Group $group)
    {
        if (!$group->members()->where('user_id', auth()->id())->exists()) {
            abort(403, 'You are not a member of this group');
        }

        if (!$group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to create assignments for this group');
        }

        return Inertia::render('Groups/Assignments/Create', [
            'groupId' => $group->id
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Group $group)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'due_date' => 'required|date',
            'unit_name' => 'nullable|string|max:255',
        ]);

        if (!$group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to create assignments for this group');
        }

        $assignment = GroupAssignment::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'due_date' => $validated['due_date'],
            'group_id' => $group->id,
            'unit_name' => $validated['unit_name'] ?? 'General',
            'created_by' => auth()->id(),
        ]);

        // Create notifications for all group members
        $notificationService = new \App\Services\NotificationService();
        $groupMembers = $group->members;

        foreach ($groupMembers as $member) {
            // Don't notify the creator
            if ($member->id != auth()->id()) {
                $notificationService->createNewAssignment($member, $assignment, auth()->user());
            }
        }

        return redirect()->route('group-assignments.show', [
            'group' => $group->id,
            'assignment' => $assignment->id
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Group $group, GroupAssignment $assignment)
    {
        if (!$group->members()->where('user_id', auth()->id())->exists()) {
            abort(403, 'You are not a member of this group');
        }

        if ($assignment->group_id !== $group->id) {
            abort(404, 'Assignment not found in this group');
        }

        $assignment->load(['group', 'tasks' => function($query) {
            $query->with(['assigned_user:id,name', 'creator:id,name'])
                  ->orderBy('order_index');
        }]);
        $isLeader = $group->isLeader(auth()->id());

        // Check if this is an AI-generated assignment
        $isAiGenerated = \App\Models\AIGeneratedAssignment::where('assignment_id', $assignment->id)
            ->where('group_id', $group->id)
            ->exists();

        // Add the is_ai_generated flag to the assignment
        $assignment->is_ai_generated = $isAiGenerated;

        return Inertia::render('Assignments/Show', [
            'assignment' => $assignment,
            'isLeader' => $isLeader
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Group $group, GroupAssignment $assignment)
    {
        if ($assignment->group_id !== $group->id) {
            abort(404, 'Assignment not found in this group');
        }

        if (!$group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to edit this assignment');
        }

        return Inertia::render('Assignments/Edit', [
            'assignment' => $assignment
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Group $group, GroupAssignment $assignment)
    {
        if ($assignment->group_id !== $group->id) {
            abort(404, 'Assignment not found in this group');
        }

        if (!$group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to update this assignment');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'due_date' => 'required|date',
            'unit_name' => 'nullable|string|max:255',
        ]);

        $assignment->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'due_date' => $validated['due_date'],
            'unit_name' => $validated['unit_name'] ?? $assignment->unit_name,
        ]);

        return redirect()->route('group-assignments.show', [
            'group' => $group->id,
            'assignment' => $assignment->id
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Group $group, GroupAssignment $assignment)
    {
        if ($assignment->group_id !== $group->id) {
            abort(404, 'Assignment not found in this group');
        }

        if (!$group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to delete this assignment');
        }

        $assignment->delete();

        return redirect()->route('group-assignments.index', [
            'group' => $group->id
        ]);
    }
}
