<?php

namespace App\Http\Controllers;

use App\Models\Group;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GroupController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $groups = Group::query()
            ->when(auth()->check(), function ($query) {
                $query->whereHas('members', function ($query) {
                    $query->where('user_id', auth()->id());
                });
            })
            ->withCount('members')
            ->latest()
            ->get();

        return Inertia::render('Groups/Index', [
            'groups' => $groups
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Groups/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $group = Group::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'owner_id' => auth()->id(),
        ]);

        $group->members()->attach(auth()->id(), ['role' => 'owner']);

        return redirect()->route('groups.show', $group);
    }

    /**
     * Display the specified resource.
     */
    public function show(Group $group)
    {
        if (!$group->members()->where('user_id', auth()->id())->exists()) {
            abort(403, 'You are not a member of this group');
        }

        $group->load(['members', 'assignments']);
        $isLeader = $group->isLeader(auth()->id());

        return Inertia::render('Groups/Show', [
            'group' => $group,
            'isLeader' => $isLeader,
            'auth' => [
                'user' => auth()->user()->only('id', 'name')
            ]
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Group $group)
    {
        if (!$group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to edit this group');
        }

        return Inertia::render('Groups/Edit', [
            'group' => $group
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Group $group)
    {
        if (!$group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to update this group');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $group->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()->route('groups.show', $group);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Group $group)
    {
        if (!$group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to delete this group');
        }

        $group->delete();

        return redirect()->route('groups.index');
    }

    /**
     * Search users by name for member invitation.
     */
    public function searchUsers(Request $request, Group $group)
    {
        if (!$group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to add members to this group');
        }

        $validated = $request->validate([
            'name' => 'required|string|min:3',
        ]);

        // Find users who are not already members of this group and match the name (partial match)
        $users = \App\Models\User::where('name', 'LIKE', '%' . $validated['name'] . '%')
            ->whereDoesntHave('groups', function ($query) use ($group) {
                $query->where('groups.id', $group->id);
            })
            ->select('id', 'name', 'email')
            ->take(5) // Limit to 5 results for security
            ->get();

        return response()->json($users);
    }

    /**
     * Show the invite members form.
     */
    public function inviteMembers(Group $group)
    {
        if (!$group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to add members to this group');
        }

        return Inertia::render('Groups/InviteMembers', [
            'group' => $group->only('id', 'name'),
        ]);
    }

    /**
     * Add a member to the group.
     */
    public function addMember(Request $request, Group $group)
    {
        if (!$group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to add members to this group');
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'role' => 'nullable|string|in:owner,admin,member',
        ]);

        $userId = $validated['user_id'];

        if ($group->members()->where('user_id', $userId)->exists()) {
            return back()->withErrors(['user_id' => 'This user is already a member of the group']);
        }

        // Add user to group
        $group->members()->attach($userId, [
            'role' => $validated['role'] ?? 'member',
        ]);

        // Create a system message in the group chat to announce the new member
        $invitedUser = \App\Models\User::find($userId);
        $group->chatMessages()->create([
            'user_id' => auth()->id(), // Message from the person who added them
            'message' => "Added {$invitedUser->name} to the group",
            'is_system_message' => true,
        ]);

        // Create notification for the invited user
        $notificationService = new \App\Services\NotificationService();
        $notificationService->createGroupInvitation($invitedUser, $group, auth()->user());

        return redirect()->route('groups.show', $group);
    }

    /**
     * Remove a member from the group.
     */
    public function removeMember(Group $group, \App\Models\User $user)
    {
        if (!$group->isLeader(auth()->id()) && auth()->id() !== $user->id) {
            abort(403, 'You are not authorized to remove this member');
        }

        if ($user->id === $group->creator_id) {
            return back()->withErrors(['user' => 'You cannot remove the creator of the group']);
        }

        $group->members()->detach($user->id);

        if (auth()->id() === $user->id) {
            return redirect()->route('groups.index');
        }

        return back();
    }
}
