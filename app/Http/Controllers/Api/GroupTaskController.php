<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GroupAssignment;
use App\Models\GroupTask;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class GroupTaskController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(GroupAssignment $assignment)
    {
        $this->authorize('view', $assignment);
        return response()->json($assignment->tasks()->orderBy('order_index')->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, GroupAssignment $assignment)
    {
        $this->authorize('create', [GroupTask::class, $assignment]);

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'assigned_to' => 'required|exists:users,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'priority' => 'required|in:low,medium,high',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $task = $assignment->tasks()->create([
            'title' => $request->title,
            'assigned_to' => $request->assigned_to,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'priority' => $request->priority,
            'description' => $request->description,
            'order_index' => $assignment->tasks()->max('order_index') + 1,
        ]);

        return response()->json($task, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(GroupTask $task)
    {
        $this->authorize('view', $task);
        return response()->json($task->load('attachments'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, GroupTask $task)
    {
        $this->authorize('update', $task);

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'assigned_to' => 'required|exists:users,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'priority' => 'required|in:low,medium,high',
            'description' => 'nullable|string',
            'order_index' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $task->update($request->all());
        return response()->json($task);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(GroupTask $task)
    {
        $this->authorize('delete', $task);
        $task->delete();
        return response()->json(null, 204);
    }

    public function complete(GroupTask $task)
    {
        $this->authorize('complete', $task);
        $task->update(['status' => 'completed']);
        return response()->json($task);
    }

    public function reorder(Request $request, GroupAssignment $assignment)
    {
        $this->authorize('update', $assignment);

        $validator = Validator::make($request->all(), [
            'tasks' => 'required|array',
            'tasks.*.id' => 'required|exists:group_tasks,id',
            'tasks.*.order_index' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        foreach ($request->tasks as $taskData) {
            $task = GroupTask::find($taskData['id']);
            $task->update(['order_index' => $taskData['order_index']]);
        }

        return response()->json($assignment->tasks()->orderBy('order_index')->get());
    }
}
