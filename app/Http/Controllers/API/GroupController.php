<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GroupController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();
        $groups = Group::whereHas('members', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->get();

        return response()->json([
            'groups' => $groups
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $group = Group::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'created_by' => Auth::id(),
        ]);

        // Add the creator as a member with admin role
        $group->members()->attach(Auth::id(), ['role' => 'admin']);

        return response()->json([
            'group' => $group,
            'message' => 'Group created successfully'
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Group $group)
    {
        // Check if the user is a member of the group
        $user = Auth::user();
        if (!$group->members()->where('user_id', $user->id)->exists()) {
            return response()->json([
                'message' => 'You are not a member of this group'
            ], 403);
        }

        $group->load('members.user', 'assignments', 'creator');

        return response()->json([
            'group' => $group
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Group $group)
    {
        // Check if the user is an admin of the group
        $user = Auth::user();
        $membership = $group->members()->where('user_id', $user->id)->first();

        if (!$membership || $membership->pivot->role !== 'admin') {
            return response()->json([
                'message' => 'You do not have permission to update this group'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $group->update($validated);

        return response()->json([
            'group' => $group,
            'message' => 'Group updated successfully'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Group $group)
    {
        // Check if the user is the creator of the group
        $user = Auth::user();

        if ($group->created_by !== $user->id) {
            return response()->json([
                'message' => 'Only the creator can delete this group'
            ], 403);
        }

        $group->delete();

        return response()->json([
            'message' => 'Group deleted successfully'
        ]);
    }

    /**
     * Search for groups by name
     */
    public function search(Request $request)
    {
        $query = $request->get('query', '');
        $user = Auth::user();

        if (empty($query)) {
            return response()->json([
                'groups' => []
            ]);
        }

        $groups = Group::where('name', 'like', "%{$query}%")
            ->whereHas('members', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->get();

        return response()->json([
            'groups' => $groups
        ]);
    }
}
