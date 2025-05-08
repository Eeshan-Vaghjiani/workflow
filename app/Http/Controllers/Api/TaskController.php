<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\GroupTask;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class TaskController extends Controller
{
    /**
     * Update the specified task.
     */
    public function update(Request $request, $id)
    {
        $task = GroupTask::findOrFail($id);
        
        // Check if the user has permission to update this task
        $this->authorize('update', $task);
        
        $validator = Validator::make($request->all(), [
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'progress' => 'nullable|integer|min:0|max:100',
            'status' => 'nullable|in:not_started,in_progress,completed',
            'priority' => 'nullable|in:low,medium,high',
            'order_index' => 'nullable|integer|min:0',
        ]);
        
        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }
        
        // Update only the provided fields
        $updates = [];
        
        if ($request->has('start_date')) {
            $updates['start_date'] = Carbon::parse($request->start_date);
        }
        
        if ($request->has('end_date')) {
            $updates['end_date'] = Carbon::parse($request->end_date);
        }
        
        if ($request->has('progress')) {
            $updates['progress'] = $request->progress;
        }
        
        if ($request->has('status')) {
            $updates['status'] = $request->status;
        }
        
        if ($request->has('priority')) {
            $updates['priority'] = $request->priority;
        }
        
        if ($request->has('order_index')) {
            $updates['order_index'] = $request->order_index;
        }
        
        // If status wasn't explicitly provided but progress was, derive status from progress
        if (!$request->has('status') && $request->has('progress')) {
            if ($request->progress >= 100) {
                $updates['status'] = 'completed';
            } elseif ($request->progress > 0) {
                $updates['status'] = 'in_progress';
            } else {
                $updates['status'] = 'not_started';
            }
        }
        
        // If progress wasn't explicitly provided but status was, derive progress from status
        if (!$request->has('progress') && $request->has('status')) {
            if ($request->status === 'completed') {
                $updates['progress'] = 100;
            } elseif ($request->status === 'in_progress' && $task->progress === 0) {
                $updates['progress'] = 50; // Set to 50% if moving from not_started to in_progress
            } elseif ($request->status === 'not_started') {
                $updates['progress'] = 0;
            }
        }
        
        $task->update($updates);
        
        return response()->json($task->fresh());
    }
    
    /**
     * Reorder tasks within an assignment.
     */
    public function reorder(Request $request, $assignmentId)
    {
        $validator = Validator::make($request->all(), [
            'tasks' => 'required|array',
            'tasks.*.id' => 'required|exists:group_tasks,id',
            'tasks.*.order' => 'required|integer|min:0',
        ]);
        
        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }
        
        // Get the assignment and verify user has permission
        $assignment = \App\Models\GroupAssignment::findOrFail($assignmentId);
        $this->authorize('update', $assignment);
        
        // Update the order of each task
        foreach ($request->tasks as $taskData) {
            $task = GroupTask::find($taskData['id']);
            
            // Verify the task belongs to this assignment
            if ($task && $task->assignment_id == $assignmentId) {
                $task->update(['order_index' => $taskData['order']]);
            }
        }
        
        // Return the updated tasks
        $tasks = GroupTask::where('assignment_id', $assignmentId)
            ->orderBy('order_index')
            ->get();
            
        return response()->json($tasks);
    }
} 