<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\GroupAssignment;
use App\Models\GroupTask;
use App\Models\User;
use App\Models\Group;
use App\Services\AIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AITaskController extends Controller
{
    protected $aiService;

    public function __construct(AIService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Process natural language prompt to create assignment tasks
     *
     * @param Request $request
     * @param int $groupId
     * @return \Illuminate\Http\JsonResponse
     */
    public function createFromPrompt(Request $request, $groupId)
    {
        // Check authentication first
        if (!Auth::check()) {
            return response()->json([
                'error' => 'Authentication required',
                'message' => 'You must be logged in to use this endpoint',
                'auth_status' => [
                    'authenticated' => false,
                    'has_session' => $request->hasSession(),
                    'cookies_received' => count($request->cookies->all()) > 0,
                    'fix' => 'Please visit /login to authenticate before trying again'
                ]
            ], 401);
        }

        // Validate request
        $validated = $request->validate([
            'prompt' => 'required|string|min:5',
        ]);

        // Check if group exists
        $group = Group::find($groupId);
        if (!$group) {
            return response()->json(['error' => 'Group not found'], 404);
        }

        $user = Auth::user();

        // Check if user is a member of the group
        if (!$group->members()->where('user_id', $user->id)->exists()) {
            return response()->json([
                'error' => 'Access denied',
                'message' => 'You are not a member of this group',
                'user_id' => $user->id,
                'group_id' => $groupId
            ], 403);
        }

        // Process prompt with AI service
        $aiResponse = $this->aiService->processTaskPrompt($validated['prompt'], $user->id, $groupId);

        // Check if AI processing encountered an error
        if (isset($aiResponse['error'])) {
            return response()->json([
                'error' => 'AI Service Error',
                'message' => $aiResponse['error'],
                'debug' => $aiResponse['debug'] ?? null
            ], 500);
        }

        // Begin transaction to create assignment and tasks
        try {
            DB::beginTransaction();
            
            // Create the assignment
            $assignment = GroupAssignment::create([
                'group_id' => $groupId,
                'title' => $aiResponse['assignment']['title'],
                'unit_name' => $aiResponse['assignment']['unit_name'] ?? 'General',
                'description' => $aiResponse['assignment']['description'] ?? '',
                'due_date' => $aiResponse['assignment']['due_date'] ?? now()->addWeeks(2),
                'priority' => $aiResponse['assignment']['priority'] ?? 'medium',
                'status' => 'active',
                'created_by' => $user->id,
            ]);

            // Process tasks
            $createdTasks = [];
            foreach ($aiResponse['tasks'] as $taskData) {
                // Find user by name if assigned_to_name is provided
                $assignedUserId = $user->id; // Default to the current user
                if (isset($taskData['assigned_to_name'])) {
                    $assignedUser = User::whereHas('groups', function ($query) use ($groupId) {
                        $query->where('group_id', $groupId);
                    })
                    ->where(function ($query) use ($taskData) {
                        $name = $taskData['assigned_to_name'];
                        $query->where('name', 'like', "%{$name}%")
                            ->orWhere('email', 'like', "{$name}%");
                    })
                    ->first();

                    if ($assignedUser) {
                        $assignedUserId = $assignedUser->id;
                    }
                }

                // Create task
                $task = GroupTask::create([
                    'assignment_id' => $assignment->id,
                    'title' => $taskData['title'],
                    'description' => $taskData['description'] ?? '',
                    'assigned_user_id' => $assignedUserId,
                    'start_date' => $taskData['start_date'] ?? now(),
                    'end_date' => $taskData['end_date'] ?? now()->addWeeks(1),
                    'status' => 'pending',
                    'priority' => $taskData['priority'] ?? 'medium',
                    'effort_hours' => $taskData['effort_hours'] ?? rand(1, 5),
                    'importance' => $taskData['importance'] ?? rand(1, 5),
                    'created_by' => $user->id,
                    'order_index' => count($createdTasks),
                ]);

                $task->load('assignedUser');
                $createdTasks[] = $task;
            }
            
            // Auto-distribute tasks if requested or if no specific assignments were made
            if ($request->input('auto_distribute', true) || !isset($aiResponse['tasks'][0]['assigned_to_name'])) {
                // Get all group members for distribution
                $groupMembers = $group->members()
                    ->with('user:id,name')
                    ->get()
                    ->map(function($member) {
                        return [
                            'id' => $member->user->id,
                            'name' => $member->user->name
                        ];
                    })
                    ->toArray();
                    
                if (!empty($groupMembers)) {
                    // Convert created tasks to array format for distributor
                    $taskArray = $createdTasks->map(function($task) {
                        return [
                            'id' => $task->id,
                            'title' => $task->title,
                            'assigned_user_id' => $task->assigned_user_id,
                            'effort_hours' => $task->effort_hours,
                            'importance' => $task->importance
                        ];
                    })->toArray();
                    
                    // Use AI service to distribute tasks based on effort and importance
                    $distributedTasks = $this->aiService->distributeTasks($taskArray, $groupMembers);
                    
                    // Update tasks with new assignments
                    foreach ($distributedTasks as $distributedTask) {
                        if (isset($distributedTask['id']) && isset($distributedTask['assigned_user_id'])) {
                            GroupTask::where('id', $distributedTask['id'])->update([
                                'assigned_user_id' => $distributedTask['assigned_user_id']
                            ]);
                            
                            // Update the task in the createdTasks collection
                            foreach ($createdTasks as $key => $task) {
                                if ($task->id === $distributedTask['id']) {
                                    $createdTasks[$key]->assigned_user_id = $distributedTask['assigned_user_id'];
                                    $createdTasks[$key]->load('assignedUser');
                                    break;
                                }
                            }
                        }
                    }
                    
                    // Log the distribution
                    Log::info('Tasks auto-distributed', [
                        'assignment_id' => $assignment->id,
                        'task_count' => count($createdTasks),
                        'member_count' => count($groupMembers)
                    ]);
                    
                    // Reload all tasks with assigned users to ensure UI shows correct assignments
                    $createdTasks = GroupTask::where('assignment_id', $assignment->id)
                        ->with('assignedUser')
                        ->get();
                }
            }

            DB::commit();

            // Return the created assignment and tasks
            return response()->json([
                'assignment' => $assignment,
                'tasks' => $createdTasks,
                'message' => 'Successfully created assignment and tasks from prompt'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create tasks from prompt', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to create tasks: ' . $e->getMessage()], 500);
        }
    }

    public function distributeTasks(Request $request, $assignmentId)
    {
        $assignment = GroupAssignment::with(['tasks', 'group.members.user'])
            ->findOrFail($assignmentId);

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

        $groupMembers = $assignment->group->members->map(function ($member) {
            return [
                'id' => $member->user->id,
                'name' => $member->user->name
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
            'message' => 'Tasks distributed successfully',
            'tasks' => $distributedTasks
        ]);
    }
} 