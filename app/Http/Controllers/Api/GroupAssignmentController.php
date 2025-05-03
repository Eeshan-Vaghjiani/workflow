<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\GroupAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class your_generic_secretr extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Group $group)
    {
        $this->authorize('view', $group);
        return response()->json($group->assignments()->with('tasks')->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Group $group)
    {
        $this->authorize('create', [GroupAssignment::class, $group]);

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'unit_name' => 'required|string|max:255',
            'priority' => 'required|in:low,medium,high',
            'due_date' => 'required|date',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $assignment = $group->assignments()->create([
            'title' => $request->title,
            'unit_name' => $request->unit_name,
            'priority' => $request->priority,
            'due_date' => $request->due_date,
            'description' => $request->description,
            'created_by' => Auth::id(),
        ]);

        return response()->json($assignment, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(GroupAssignment $assignment)
    {
        $this->authorize('view', $assignment);
        return response()->json($assignment->load('tasks'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, GroupAssignment $assignment)
    {
        $this->authorize('update', $assignment);

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'unit_name' => 'required|string|max:255',
            'priority' => 'required|in:low,medium,high',
            'due_date' => 'required|date',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $assignment->update($request->all());
        return response()->json($assignment);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(GroupAssignment $assignment)
    {
        $this->authorize('delete', $assignment);
        $assignment->delete();
        return response()->json(null, 204);
    }
}
