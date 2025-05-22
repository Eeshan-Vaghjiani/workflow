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
    public function index(Group $group = null)
    {
        // Start with a query that always includes group data
        $query = GroupAssignment::query()->with('group');
        
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
        
        $assignments = $query->latest()->get();
        
        // Filter out any assignments with null groups (shouldn't happen, but just in case)
        $assignments = $assignments->filter(function ($assignment) {
            return $assignment->group !== null;
        });

        return Inertia::render('Assignments/Index', [
            'assignments' => $assignments,
            'group' => $group
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $groups = Group::whereHas('members', function ($query) {
            $query->where('user_id', auth()->id());
        })
        ->get()
        ->filter(function ($group) {
            return $group->isLeader(auth()->id());
        });

        return Inertia::render('Assignments/Create', [
            'groups' => $groups
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
