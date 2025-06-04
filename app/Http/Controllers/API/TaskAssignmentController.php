<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\GroupTask;
use App\Models\GroupAssignment;
use App\Models\Group;
use App\Services\AIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Auth\Access\AuthorizationException;

class TaskAssignmentController extends Controller
{
    protected $aiService;

    /**
     * Constructor to apply middleware and inject dependencies
     */
    public function __construct(AIService $aiService)
    {
        // Use the middleware array to accept both web and API authentication
        $this->middleware(['auth:sanctum,web']);
        $this->aiService = $aiService;
    }

    /**
     * Auto-distribute tasks for an assignment based on effort and importance.
     */
    public function autoDistributeTasks(Request $request, $groupId, $assignmentId)
    {
        try {
            // Load assignment
            $assignment = GroupAssignment::where('id', $assignmentId)
                ->where('group_id', $groupId)
                ->firstOrFail();

            // Check if user is authorized
            if (!$assignment->group->isLeader(auth()->id())) {
                return response()->json(['error' => 'You are not authorized to distribute tasks for this assignment'], 403);
            }

            // Check if any tasks have due dates that are not valid
            $tasks = GroupTask::where('assignment_id', $assignmentId)->get();
            $assignmentDueDate = $assignment->due_date ? $assignment->due_date->format('Y-m-d') : null;
            $today = now()->format('Y-m-d');

            $invalidTasks = $tasks->filter(function($task) use ($assignmentDueDate, $today) {
                if (!$task->end_date) return false;

                $taskDueDate = $task->end_date->format('Y-m-d');
                return ($assignmentDueDate && $taskDueDate > $assignmentDueDate) || $taskDueDate < $today;
            });

            if ($invalidTasks->count() > 0) {
                $invalidTasksList = $invalidTasks->map(function($task) {
                    return $task->title;
                })->join(', ');

                return response()->json([
                    'error' => 'Cannot auto-assign tasks because some tasks have invalid due dates. Please fix the following tasks: ' . $invalidTasksList
                ], 400);
            }

            $tasks = $tasks->toArray();

            // Get all group members
            $groupMembers = $assignment->group->members()->get()->map(function($member) {
                // Add null check for user
                if (!$member) {
                    Log::warning('Found null group member');
                    return null;
                }

                return [
                    'id' => $member->id,
                    'name' => $member->name
                ];
            })->filter()->toArray();  // Filter out null entries

            // Check if there are any valid members to distribute tasks to
            if (empty($groupMembers)) {
                return response()->json([
                    'error' => 'Cannot distribute tasks: No valid group members found'
                ], 400);
            }

            // Distribute tasks using AI service
            try {
                $distributedTasks = $this->aiService->distributeTasks($tasks, $groupMembers);

                // Update tasks in database
                foreach ($distributedTasks as $task) {
                    if (isset($task['id']) && isset($task['assigned_user_id'])) {
                        GroupTask::where('id', $task['id'])->update([
                            'assigned_user_id' => $task['assigned_user_id']
                        ]);
                    }
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Tasks distributed successfully',
                    'tasks' => $distributedTasks
                ]);
            } catch (\Exception $e) {
                Log::error('Error distributing tasks', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                    'group_members' => $groupMembers,
                    'tasks_count' => count($tasks)
                ]);

                return response()->json([
                    'error' => 'Failed to distribute tasks: ' . $e->getMessage()
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Error in autoDistributeTasks', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'group_id' => $groupId,
                'assignment_id' => $assignmentId
            ]);

            return response()->json([
                'error' => 'Failed to distribute tasks: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get task assignment stats by member for an assignment
     */
    public function getAssignmentStats(Request $request, $groupId, $assignmentId)
    {
        try {
            Log::info('Fetching assignment stats', [
                'group_id' => $groupId,
                'assignment_id' => $assignmentId,
                'user_id' => auth()->id(),
                'session_id' => session()->getId()
            ]);

            // Validate input parameters
            if (!is_numeric($groupId) || !is_numeric($assignmentId)) {
                throw new \InvalidArgumentException('Invalid group or assignment ID');
            }

            // Eager load the assignment with its group and members
            $assignment = GroupAssignment::with([
                'group:id,name',
                'group.members:id,name',
                'tasks' => function ($query) {
                    $query->with(['assigned_user:id,name', 'creator:id,name'])
                          ->orderBy('order_index');
                }
            ])->findOrFail($assignmentId);

            // Check if user is a member of the group
            if (!$assignment->group->isMember(auth()->user())) {
                throw new AuthorizationException('You are not a member of this group');
            }

            // Get tasks with their assignments
            $tasks = $assignment->tasks;

            // Get group members
            $groupMembers = $assignment->group->members()
                ->select('users.id', 'users.name')
                ->get();

            // Calculate workload distribution
            $workloadDistribution = $this->calculateWorkloadDistribution($tasks, $groupMembers);

            // Check for unassigned tasks
            $hasUnassignedTasks = $tasks->contains('assigned_user_id', null);

            return response()->json([
                'success' => true,
                'tasks' => $tasks,
                'groupMembers' => $groupMembers,
                'workloadDistribution' => $workloadDistribution,
                'hasUnassignedTasks' => $hasUnassignedTasks
            ]);

        } catch (\Exception $e) {
            Log::error('Error in getAssignmentStats', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'group_id' => $groupId,
                'assignment_id' => $assignmentId
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch assignment statistics: ' . $e->getMessage(),
                'error_details' => [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString()
                ]
            ], 500);
        }
    }

    /**
     * Calculate workload distribution statistics
     */
    private function calculateWorkloadDistribution($tasks, $groupMembers)
    {
        $distribution = [];
        $totalEffort = $tasks->sum('effort_hours');
        $totalImportance = $tasks->sum('importance');

        foreach ($groupMembers as $member) {
            $memberTasks = $tasks->where('assigned_user_id', $member->id);
            $taskCount = $memberTasks->count();
            $memberEffort = $memberTasks->sum('effort_hours');
            $memberImportance = $memberTasks->sum('importance');

            $percentage = $totalEffort > 0 ? ($memberEffort / $totalEffort) * 100 : 0;

            $distribution[] = [
                'id' => $member->id,
                'name' => $member->name,
                'taskCount' => $taskCount,
                'totalEffort' => $memberEffort,
                'totalImportance' => $memberImportance,
                'weightedWorkload' => ($memberEffort * 0.7) + ($memberImportance * 0.3),
                'percentage' => round($percentage, 1),
                'tasks' => $memberTasks->map(function ($task) {
                    return [
                        'id' => $task->id,
                        'title' => $task->title,
                        'description' => $task->description,
                        'effort' => $task->effort_hours,
                        'importance' => $task->importance,
                        'status' => $task->status,
                        'start_date' => $task->start_date,
                        'end_date' => $task->end_date,
                    ];
                })->values()->toArray()
            ];
        }

        return $distribution;
    }
}
