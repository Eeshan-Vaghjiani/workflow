<?php

namespace App\Http\Controllers;

use App\Models\GroupAssignment;
use App\Models\Group;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GroupAssignmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $assignments = GroupAssignment::query()
            ->with('group:id,name')
            ->whereHas('group.members', function ($query) {
                $query->where('user_id', auth()->id());
            })
            ->latest()
            ->get();

        return Inertia::render('Assignments/Index', [
            'assignments' => $assignments
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $groups = Group::whereHas('members', function ($query) {
            $query->where('user_id', auth()->id())
                ->where('role', 'owner');
        })->get();

        return Inertia::render('Assignments/Create', [
            'groups' => $groups
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
            'due_date' => 'required|date',
            'group_id' => 'required|exists:groups,id',
            'unit_name' => 'nullable|string|max:255',
        ]);

        $group = Group::findOrFail($validated['group_id']);

        if (!$group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to create assignments for this group');
        }

        $assignment = GroupAssignment::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'due_date' => $validated['due_date'],
            'group_id' => $validated['group_id'],
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

        return redirect()->route('group-assignments.show', $assignment);
    }

    /**
     * Display the specified resource.
     */
    public function show(GroupAssignment $groupAssignment)
    {
        if (!$groupAssignment->group->members()->where('user_id', auth()->id())->exists()) {
            abort(403, 'You are not a member of this group');
        }

        $groupAssignment->load(['group', 'tasks']);
        $isLeader = $groupAssignment->group->isLeader(auth()->id());

        return Inertia::render('Assignments/Show', [
            'assignment' => $groupAssignment,
            'isLeader' => $isLeader
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(GroupAssignment $groupAssignment)
    {
        if (!$groupAssignment->group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to edit this assignment');
        }

        return Inertia::render('Assignments/Edit', [
            'assignment' => $groupAssignment
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, GroupAssignment $groupAssignment)
    {
        if (!$groupAssignment->group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to update this assignment');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'due_date' => 'required|date',
            'unit_name' => 'nullable|string|max:255',
        ]);

        $groupAssignment->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'due_date' => $validated['due_date'],
            'unit_name' => $validated['unit_name'] ?? $groupAssignment->unit_name,
        ]);

        return redirect()->route('group-assignments.show', $groupAssignment);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(GroupAssignment $groupAssignment)
    {
        if (!$groupAssignment->group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to delete this assignment');
        }

        $groupAssignment->delete();

        return redirect()->route('group-assignments.index');
    }
}
