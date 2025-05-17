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
                    'assigned_to' => $assignedUserId,
                    'start_date' => $taskData['start_date'] ?? now(),
                    'end_date' => $taskData['end_date'] ?? now()->addWeeks(1),
                    'status' => 'pending',
                    'priority' => $taskData['priority'] ?? 'medium',
                    'created_by' => $user->id,
                    'order_index' => count($createdTasks),
                ]);

                $task->load('assignedUser');
                $createdTasks[] = $task;
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
} 