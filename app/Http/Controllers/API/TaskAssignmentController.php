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
            $assignment = GroupAssignment::with(['tasks', 'group.members'])
                ->where('group_id', $groupId)
                ->where('id', $assignmentId)
                ->firstOrFail();

            // Add debug logging
            $userId = auth()->id();
            $userRole = $assignment->group->members()
                ->where('user_id', $userId)
                ->value('role');
            
            \Illuminate\Support\Facades\Log::info('Task distribution authorization check', [
                'user_id' => $userId,
                'user_role' => $userRole,
                'group_id' => $groupId,
                'assignment_id' => $assignmentId,
                'is_leader' => $assignment->group->isLeader($userId)
            ]);

            // Check if user is authorized
            if (!$assignment->group->isLeader($userId)) {
                throw new AuthorizationException('You are not authorized to distribute tasks for this assignment');
            }

            // Get all tasks and group members
            $tasks = $assignment->tasks->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'effort_hours' => $task->effort_hours,
                    'importance' => $task->importance,
                    'assigned_user_id' => $task->assigned_user_id,
                    'assigned_to_name' => $task->assigned_user ? $task->assigned_user->name : null
                ];
            })->toArray();

            // Get group members with their user data
            $groupMembers = $assignment->group->members()
                ->select('users.id', 'users.name')
                ->get()
                ->map(function ($member) {
                    return [
                        'id' => $member->id,
                        'name' => $member->name
                    ];
                })->toArray();

            // Distribute tasks using AI service
            $distributedTasks = $this->aiService->distributeTasks($tasks, $groupMembers);

            // Update tasks in database
            foreach ($distributedTasks as $task) {
                GroupTask::where('id', $task['id'])->update([
                    'assigned_user_id' => $task['assigned_user_id']
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Tasks distributed successfully',
                'tasks' => $distributedTasks
            ]);
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
