<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GroupMemberController extends Controller
{
    /**
     * Display a listing of members for a group.
     */
    public function index(Group $group)
    {
        if (!$group->members()->where('user_id', auth()->id())->exists()) {
            abort(403, 'You are not a member of this group');
        }

        $members = $group->members()->with(['groups' => function ($query) use ($group) {
            $query->where('groups.id', $group->id);
        }])->get();

        return Inertia::render('Groups/Members/Index', [
            'group' => $group,
            'members' => $members,
            'isLeader' => $group->isLeader(auth()->id())
        ]);
    }

    /**
     * Show the invite members form.
     */
    public function invite(Group $group)
    {
        if (!$group->isLeader(auth()->id())) {
            abort(403, 'You are not authorized to invite members to this group');
        }

        return Inertia::render('Groups/Members/Invite', [
            'group' => $group->only('id', 'name'),
        ]);
    }

    /**
     * Store a new member in the group.
     */
    public function store(Request $request, Group $group)
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
        $invitedUser = User::find($userId);
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
    public function destroy(Group $group, User $member)
    {
        if (!$group->isLeader(auth()->id()) && auth()->id() !== $member->id) {
            abort(403, 'You are not authorized to remove this member');
        }

        if ($member->id === $group->owner_id) {
            return back()->withErrors(['user' => 'You cannot remove the owner of the group']);
        }

        $group->members()->detach($member->id);

        if (auth()->id() === $member->id) {
            return redirect()->route('groups.index');
        }

        return back();
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
        $users = User::where('name', 'LIKE', '%' . $validated['name'] . '%')
            ->whereDoesntHave('groups', function ($query) use ($group) {
                $query->where('groups.id', $group->id);
            })
            ->select('id', 'name', 'email')
            ->take(5) // Limit to 5 results for security
            ->get();

        return response()->json($users);
    }
} 