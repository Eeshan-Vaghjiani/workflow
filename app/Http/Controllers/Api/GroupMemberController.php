<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class GroupMemberController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Group $group)
    {
        $this->authorize('view', $group);
        return response()->json($group->members);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Group $group)
    {
        $this->authorize('addMember', $group);

        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::where('email', $request->email)->first();
        
        if ($group->members()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'User is already a member of this group'], 422);
        }

        $group->members()->attach($user->id, ['role' => 'member']);

        return response()->json($group->members, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Group $group, User $user)
    {
        $this->authorize('removeMember', $group);

        if ($group->members()->where('user_id', $user->id)->where('role', 'leader')->exists()) {
            return response()->json(['message' => 'Cannot remove group leader'], 422);
        }

        $group->members()->detach($user->id);
        return response()->json(null, 204);
    }
}
