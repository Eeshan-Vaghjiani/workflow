<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GroupMemberController extends Controller
{
    /**
     * Display a listing of the members for a group.
     */
    public function index(Group $group)
    {
        // Check if the user is a member of the group
        $user = Auth::user();
        if (!$group->members()->where('user_id', $user->id)->exists()) {
            return response()->json([
                'message' => 'You are not a member of this group'
            ], 403);
        }

        $members = $group->members()->with('user')->get();

        return response()->json([
            'members' => $members
        ]);
    }

    /**
     * Add a member to the group.
     */
    public function store(Request $request, Group $group)
    {
        // Check if the user is an admin of the group
        $user = Auth::user();
        $membership = $group->members()->where('user_id', $user->id)->first();

        if (!$membership || $membership->pivot->role !== 'admin') {
            return response()->json([
                'message' => 'You do not have permission to add members to this group'
            ], 403);
        }

        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
            'role' => 'required|in:admin,member',
        ]);

        $newMember = User::where('email', $validated['email'])->first();

        // Check if the user is already a member
        if ($group->members()->where('user_id', $newMember->id)->exists()) {
            return response()->json([
                'message' => 'User is already a member of this group'
            ], 400);
        }

        $group->members()->attach($newMember->id, ['role' => $validated['role']]);

        return response()->json([
            'message' => 'Member added successfully',
            'member' => $newMember
        ], 201);
    }

    /**
     * Remove a member from the group.
     */
    public function destroy(Group $group, User $user)
    {
        // Check if the authenticated user is an admin of the group
        $authUser = Auth::user();
        $membership = $group->members()->where('user_id', $authUser->id)->first();

        if (!$membership || $membership->pivot->role !== 'admin') {
            // Allow users to remove themselves from a group
            if ($authUser->id !== $user->id) {
                return response()->json([
                    'message' => 'You do not have permission to remove members from this group'
                ], 403);
            }
        }

        // Check if the user is actually a member
        if (!$group->members()->where('user_id', $user->id)->exists()) {
            return response()->json([
                'message' => 'User is not a member of this group'
            ], 400);
        }

        // Prevent removing the last admin
        if ($user->id !== $authUser->id && $group->members()->wherePivot('role', 'admin')->count() <= 1 && $group->members()->where('user_id', $user->id)->wherePivot('role', 'admin')->exists()) {
            return response()->json([
                'message' => 'Cannot remove the last admin from the group'
            ], 400);
        }

        $group->members()->detach($user->id);

        return response()->json([
            'message' => 'Member removed successfully'
        ]);
    }
}
