<?php

namespace App\Http\Controllers;

use App\Models\GroupAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaskAssignmentController extends Controller
{
    /**
     * Display the task assignments for a specific assignment.
     */
    public function show(Request $request, $groupId, $assignmentId)
    {
        // Get the assignment with tasks and assigned users
        $assignment = GroupAssignment::where('id', $assignmentId)
            ->where('group_id', $groupId)
            ->with(['group', 'tasks' => function($query) {
                $query->with('assigned_user:id,name')
                      ->orderBy('order_index', 'asc');
            }])
            ->firstOrFail();
        if (!$assignment->group->members()->where('user_id', auth()->id())->exists()) {
            abort(403, 'You are not a member of this group');
        }
        
        return Inertia::render('tasks/Assignment', [
            'groupId' => (int) $groupId,
            'assignmentId' => (int) $assignmentId,
            'assignment' => [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'group_id' => $assignment->group_id,
                'group' => [
                    'id' => $assignment->group->id,
                    'name' => $assignment->group->name
                ],
                'tasks' => $assignment->tasks->map(function ($task) {
                    return [
                        'id' => $task->id,
                        'title' => $task->title,
                        'description' => $task->description,
                        'start_date' => $task->start_date,
                        'end_date' => $task->end_date,
                        'status' => $task->status,
                        'priority' => $task->priority,
                        'order_index' => $task->order_index,
                        'assigned_user' => $task->assigned_user ? [
                            'id' => $task->assigned_user->id,
                            'name' => $task->assigned_user->name
                        ] : null
                    ];
                })
            ],
        ]);
    }
} 