<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\GroupAssignment;
use App\Models\GroupTask;
use App\Models\AIGeneratedAssignment;
use App\Models\AIPrompt;
use App\Services\AIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AITaskController extends Controller
{
    protected $aiService;

    public function __construct(AIService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Show the AI task generation page for a group
     */
    public function index(Request $request, Group $group)
    {
        // Check if user is member of the group
        if (!$group->members()->where('user_id', Auth::id())->exists()) {
            abort(403, 'You are not a member of this group');
        }

        // Get the group members with their user data
        $members = $group->members()
            ->select('users.id', 'users.name', 'users.email')
            ->get();

        // Get all tasks for this group to calculate workload stats
        $tasks = GroupTask::whereHas('assignment', function($query) use ($group) {
            $query->where('group_id', $group->id);
        })->with('assigned_user:id,name')->get();

        // Calculate workload distribution
        $workloadDistribution = $this->calculateWorkloadDistribution($tasks, $members);

        return Inertia::render('Groups/AITaskAssignment', [
            'group' => [
                'id' => $group->id,
                'name' => $group->name,
                'members' => $members
            ],
            'workloadStats' => [
                'distribution' => $workloadDistribution,
                'hasUnassignedTasks' => $tasks->contains('assigned_user_id', null)
            ]
        ]);
    }

    /**
     * Show the AI task generation page for a specific assignment
     */
    public function forAssignment(Request $request, Group $group, GroupAssignment $assignment)
    {
        // Check if user is member of the group
        if (!$group->members()->where('user_id', Auth::id())->exists()) {
            abort(403, 'You are not a member of this group');
        }

        // Check if assignment belongs to the group
        if ($assignment->group_id !== $group->id) {
            abort(404, 'Assignment not found in this group');
        }

        // Get the group members with their user data
        $members = $group->members()
            ->select('users.id', 'users.name', 'users.email')
            ->get();

        // Get tasks for this assignment to calculate workload stats
        $tasks = $assignment->tasks()->with('assigned_user:id,name')->get();

        // Calculate workload distribution
        $workloadDistribution = $this->calculateWorkloadDistribution($tasks, $members);

        return Inertia::render('Groups/AITaskAssignment', [
            'group' => [
                'id' => $group->id,
                'name' => $group->name,
                'members' => $members
            ],
            'assignment' => [
                'id' => $assignment->id,
                'title' => $assignment->title
            ],
            'workloadStats' => [
                'distribution' => $workloadDistribution,
                'hasUnassignedTasks' => $tasks->contains('assigned_user_id', null)
            ]
        ]);
    }

    /**
     * Calculate workload distribution statistics
     * Similar to the one in TaskAssignmentController but adapted for our needs
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

    /**
     * Generate tasks for an assignment using AI
     */
    public function generateTasks(Request $request, Group $group)
    {
        // Detailed authentication check with logging
        if (!Auth::check()) {
            Log::warning('AI Task Generation: Unauthenticated access attempt', [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return response()->json([
                'error' => 'Authentication required. Please log in to continue.',
                'auth_status' => false,
                'redirect' => '/login'
            ], 401);
        }

        // Log the authenticated user making the request
        Log::info('AI Task Generation: Request received', [
            'user_id' => Auth::id(),
            'user_email' => Auth::user()->email,
            'group_id' => $group->id,
            'assignment_id' => $request->input('assignment_id'),
        ]);

        // Check if user is member of the group with detailed response
        if (!$group->members()->where('user_id', Auth::id())->exists()) {
            Log::warning('AI Task Generation: Non-member access attempt', [
                'user_id' => Auth::id(),
                'group_id' => $group->id,
            ]);

            return response()->json([
                'error' => 'You are not a member of this group.',
                'auth_status' => true,
                'permission' => false
            ], 403);
        }

        $request->validate([
            'prompt' => 'required|string|min:10',
            'assignment_id' => 'nullable|exists:group_assignments,id'
        ]);

        try {
            // Log the prompt being processed
            Log::info('AI Task Generation: Processing prompt', [
                'prompt_length' => strlen($request->prompt),
                'user_id' => Auth::id(),
            ]);

            $result = $this->aiService->processTaskPrompt(
                $request->prompt,
                Auth::id(),
                $group->id
            );

            // Check if the user needs to purchase more prompts
            if (isset($result['redirect_to_pricing']) && $result['redirect_to_pricing']) {
                return response()->json([
                    'error' => $result['error'],
                    'redirect' => route('pricing.index')
                ], 403);
            }

            if (isset($result['error'])) {
                Log::error('AI Task Generation: Error in AI processing', [
                    'error' => $result['error'],
                    'user_id' => Auth::id(),
                ]);

                return response()->json([
                    'error' => $result['error']
                ], 500);
            }

            // Log successful task generation
            Log::info('AI Task Generation: Tasks generated successfully', [
                'user_id' => Auth::id(),
                'task_count' => count($result['tasks'] ?? []),
            ]);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('AI Task Generation: Exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'error' => 'An error occurred: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new assignment with AI-generated tasks
     */
    public function createAssignment(Request $request, Group $group)
    {
        // Check if user is member of the group
        if (!$group->members()->where('user_id', Auth::id())->exists()) {
            return response()->json(['error' => 'You are not a member of this group'], 403);
        }

        // Validate request
        $validated = $request->validate([
            'assignment' => 'required|array',
            'assignment.title' => 'required|string|max:255',
            'assignment.unit_name' => 'required|string|max:255',
            'assignment.description' => 'required|string',
            'assignment.due_date' => 'required|date',
            'tasks' => 'required|array',
            'tasks.*.title' => 'required|string|max:255',
            'tasks.*.description' => 'required|string',
            'tasks.*.start_date' => 'required|date',
            'tasks.*.end_date' => 'required|date|after_or_equal:tasks.*.start_date',
            'tasks.*.priority' => 'required|in:low,medium,high',
            'tasks.*.effort_hours' => 'required|numeric|min:1|max:100',
            'tasks.*.importance' => 'required|integer|min:1|max:5',
            'tasks.*.assigned_to_name' => 'nullable|string',
            'prompt' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            // Get the due date from the assignment
            $dueDate = $validated['assignment']['due_date'];
            $today = now()->startOfDay();
            $dueDateObj = \Carbon\Carbon::parse($dueDate)->startOfDay();

            // Create the assignment
            $assignment = GroupAssignment::create([
                'group_id' => $group->id,
                'title' => $validated['assignment']['title'],
                'description' => $validated['assignment']['description'] ?? '',
                'unit_name' => $validated['assignment']['unit_name'] ?? 'General',
                'due_date' => $dueDate,
                'start_date' => now(),
                'end_date' => $dueDate,
                'status' => 'active',
                'created_by' => Auth::id(),
            ]);

            // Get the model used from the AI service
            $modelUsed = $this->aiService->getWorkingModel();

            // Create an entry in the AI generated assignments table
            $aiGeneratedAssignment = \App\Models\AIGeneratedAssignment::create([
                'group_id' => $group->id,
                'assignment_id' => $assignment->id,
                'original_prompt' => $validated['prompt'] ?? 'No prompt provided',
                'ai_response' => json_encode($validated),
                'model_used' => $modelUsed,
                'created_by' => Auth::id(),
            ]);

            // Create tasks
            foreach ($validated['tasks'] as $taskData) {
                // Find the user ID based on the name
                $assignedUserId = null;
                if (!empty($taskData['assigned_to_name'])) {
                    $user = $group->members()
                        ->where('users.name', 'like', '%' . $taskData['assigned_to_name'] . '%')
                        ->first();
                    if ($user) {
                        $assignedUserId = $user->id;
                    }
                }

                // Validate and adjust dates if necessary
                $startDate = \Carbon\Carbon::parse($taskData['start_date'])->startOfDay();
                $endDate = \Carbon\Carbon::parse($taskData['end_date'])->startOfDay();

                // Ensure start date is not in the past
                if ($startDate->lt($today)) {
                    $startDate = $today;
                }

                // Ensure end date is not after the assignment due date
                if ($endDate->gt($dueDateObj)) {
                    $endDate = $dueDateObj;
                }

                // Ensure end date is not before start date
                if ($endDate->lt($startDate)) {
                    // Calculate appropriate end date based on effort hours
                    $effortHours = $taskData['effort_hours'] ?? 1;
                    if ($effortHours <= 3) {
                        // Simple task: 1-3 days
                        $endDate = $startDate->copy()->addDays(min(3, $dueDateObj->diffInDays($startDate)));
                    } elseif ($effortHours <= 8) {
                        // Medium task: 3-7 days
                        $endDate = $startDate->copy()->addDays(min(7, $dueDateObj->diffInDays($startDate)));
                    } else {
                        // Complex task: 7-14 days
                        $endDate = $startDate->copy()->addDays(min(14, $dueDateObj->diffInDays($startDate)));
                    }

                    // Final check to ensure end date doesn't exceed due date
                    if ($endDate->gt($dueDateObj)) {
                        $endDate = $dueDateObj;
                    }
                }

                GroupTask::create([
                    'assignment_id' => $assignment->id,
                    'title' => $taskData['title'],
                    'description' => $taskData['description'],
                    'start_date' => $startDate->format('Y-m-d'),
                    'end_date' => $endDate->format('Y-m-d'),
                    'status' => 'pending',
                    'priority' => $taskData['priority'] ?? 'medium',
                    'effort_hours' => $taskData['effort_hours'] ?? 1,
                    'importance' => $taskData['importance'] ?? 3,
                    'assigned_user_id' => $assignedUserId,
                    'created_by' => Auth::id(),
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Assignment and tasks created successfully',
                'redirect_url' => route('group-assignments.show', ['group' => $group->id, 'assignment' => $assignment->id])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'error' => 'Failed to create assignment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add AI-generated tasks to an existing assignment
     */
    public function addTasksToAssignment(Request $request, Group $group, GroupAssignment $assignment)
    {
        // Check if user is member of the group
        if (!$group->members()->where('user_id', Auth::id())->exists()) {
            return response()->json(['error' => 'You are not a member of this group'], 403);
        }

        // Check if assignment belongs to the group
        if ($assignment->group_id !== $group->id) {
            return response()->json(['error' => 'Assignment not found in this group'], 404);
        }

        // Validate request
        $validated = $request->validate([
            'tasks' => 'required|array',
            'tasks.*.title' => 'required|string|max:255',
            'tasks.*.description' => 'required|string',
            'tasks.*.start_date' => 'required|date',
            'tasks.*.end_date' => 'required|date|after_or_equal:tasks.*.start_date',
            'tasks.*.priority' => 'required|in:low,medium,high',
            'tasks.*.effort_hours' => 'required|numeric|min:1|max:100',
            'tasks.*.importance' => 'required|integer|min:1|max:5',
            'tasks.*.assigned_to_name' => 'nullable|string',
        ]);

        try {
            // Start transaction
            DB::beginTransaction();

            // Get the assignment due date
            $dueDate = $assignment->due_date;
            $today = now()->startOfDay();
            $dueDateObj = \Carbon\Carbon::parse($dueDate)->startOfDay();

            // Create tasks
            foreach ($validated['tasks'] as $taskData) {
                // Find user by name if assigned_to_name is provided
                $assignedUserId = null;

                if (!empty($taskData['assigned_to_name'])) {
                    // Direct query for user by name and group membership
                    $member = DB::table('users')
                        ->join('group_user', 'users.id', '=', 'group_user.user_id')
                        ->where('group_user.group_id', $group->id)
                        ->where('users.name', $taskData['assigned_to_name'])
                        ->select('users.id')
                        ->first();

                    if ($member) {
                        $assignedUserId = $member->id;
                    }
                }

                // Validate and adjust dates if necessary
                $startDate = \Carbon\Carbon::parse($taskData['start_date'])->startOfDay();
                $endDate = \Carbon\Carbon::parse($taskData['end_date'])->startOfDay();

                // Ensure start date is not in the past
                if ($startDate->lt($today)) {
                    $startDate = $today;
                }

                // Ensure end date is not after the assignment due date
                if ($endDate->gt($dueDateObj)) {
                    $endDate = $dueDateObj;
                }

                // Ensure end date is not before start date
                if ($endDate->lt($startDate)) {
                    // Calculate appropriate end date based on effort hours
                    $effortHours = $taskData['effort_hours'] ?? 1;
                    if ($effortHours <= 3) {
                        // Simple task: 1-3 days
                        $endDate = $startDate->copy()->addDays(min(3, $dueDateObj->diffInDays($startDate)));
                    } elseif ($effortHours <= 8) {
                        // Medium task: 3-7 days
                        $endDate = $startDate->copy()->addDays(min(7, $dueDateObj->diffInDays($startDate)));
                    } else {
                        // Complex task: 7-14 days
                        $endDate = $startDate->copy()->addDays(min(14, $dueDateObj->diffInDays($startDate)));
                    }

                    // Final check to ensure end date doesn't exceed due date
                    if ($endDate->gt($dueDateObj)) {
                        $endDate = $dueDateObj;
                    }
                }

                GroupTask::create([
                    'assignment_id' => $assignment->id,
                    'title' => $taskData['title'],
                    'description' => $taskData['description'],
                    'start_date' => $startDate->format('Y-m-d'),
                    'end_date' => $endDate->format('Y-m-d'),
                    'status' => 'pending',
                    'priority' => $taskData['priority'],
                    'effort_hours' => $taskData['effort_hours'],
                    'importance' => $taskData['importance'],
                    'assigned_user_id' => $assignedUserId,
                    'created_by' => Auth::id(),
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Tasks added to assignment successfully',
                'redirect_url' => route('group-assignments.show', ['group' => $group->id, 'assignment' => $assignment->id])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'error' => 'Failed to add tasks to assignment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Automatically distribute tasks among group members
     */
    public function autoDistributeTasks(Request $request, Group $group)
    {
        // Check if user is member of the group
        if (!$group->members()->where('user_id', Auth::id())->exists()) {
            return response()->json(['error' => 'You are not a member of this group'], 403);
        }

        // Validate request
        $validated = $request->validate([
            'tasks' => 'required|array',
            'members' => 'required|array',
        ]);

        try {
            $tasks = $validated['tasks'];
            $members = $validated['members'];

            // Create a weighted distribution of tasks based on effort and importance
            $memberIds = array_column($members, 'id');
            $memberCount = count($memberIds);

            if ($memberCount === 0) {
                return response()->json(['error' => 'No members available for task distribution'], 400);
            }

            // Shuffle the member IDs to ensure random initial assignment
            shuffle($memberIds);

            // Sort tasks by effort and importance (highest combined score first)
            usort($tasks, function ($a, $b) {
                $scoreA = ($a['effort_hours'] * 0.7) + ($a['importance'] * 0.3);
                $scoreB = ($b['effort_hours'] * 0.7) + ($b['importance'] * 0.3);
                return $scoreB <=> $scoreA;
            });

            // Assign tasks to members using a greedy algorithm
            $memberWorkloads = array_fill_keys($memberIds, 0);

            foreach ($tasks as &$task) {
                // Find the member with the lowest current workload
                $minWorkloadMemberId = array_keys($memberWorkloads, min($memberWorkloads))[0];

                // Assign the task to this member
                $task['assigned_user_id'] = $minWorkloadMemberId;

                // Find the member name
                $memberName = null;
                foreach ($members as $member) {
                    if ($member['id'] == $minWorkloadMemberId) {
                        $memberName = $member['name'];
                        break;
                    }
                }
                $task['assigned_to_name'] = $memberName;

                // Update the member's workload
                $memberWorkloads[$minWorkloadMemberId] += ($task['effort_hours'] * 0.7) + ($task['importance'] * 0.3);
            }

            // Get the group members with their user data
            $groupMembers = $group->members()
                ->select('users.id', 'users.name', 'users.email')
                ->get();

            // Get existing tasks for this group to calculate current workload
            $existingTasks = GroupTask::whereHas('assignment', function($query) use ($group) {
                $query->where('group_id', $group->id);
            })->with('assigned_user:id,name')->get();

            // Create temporary task objects from the redistributed tasks
            $generatedTasks = collect();
            foreach ($tasks as $taskData) {
                // Create a temporary task object with the same structure as DB tasks
                $task = new \stdClass();
                $task->id = 'temp_' . uniqid();
                $task->title = $taskData['title'];
                $task->description = $taskData['description'];
                $task->start_date = $taskData['start_date'];
                $task->end_date = $taskData['end_date'];
                $task->priority = $taskData['priority'];
                $task->effort_hours = $taskData['effort_hours'];
                $task->importance = $taskData['importance'];
                $task->assigned_user_id = $taskData['assigned_user_id'];

                // Find the assigned user name
                $assignedUserName = null;
                if (!empty($taskData['assigned_user_id'])) {
                    $user = $groupMembers->where('id', $taskData['assigned_user_id'])->first();
                    if ($user) {
                        $assignedUserName = $user->name;
                    }
                }
                $task->assigned_user = $assignedUserName ? (object)['id' => $taskData['assigned_user_id'], 'name' => $assignedUserName] : null;

                $generatedTasks->push($task);
            }

            // Calculate workload distribution based on the redistributed tasks
            // For redistribution, we only consider the tasks being redistributed, not existing ones
            $workloadDistribution = $this->calculateWorkloadDistribution($generatedTasks, $groupMembers);

            return response()->json([
                'tasks' => $tasks,
                'workloadStats' => [
                    'distribution' => $workloadDistribution,
                    'hasUnassignedTasks' => $generatedTasks->contains(function($task) {
                        return empty($task->assigned_user_id);
                    })
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to distribute tasks: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the AI Task dashboard
     */
    public function dashboard()
    {
        $user = Auth::user();

        // Get groups the user is a member of with direct SQL join to avoid relationship issues
        $groups = Group::join('group_user', 'groups.id', '=', 'group_user.group_id')
            ->where('group_user.user_id', $user->id)
            ->select('groups.*')
            ->distinct()
            ->get();

        // Get AI-generated assignments for these groups with explicit loads
        $aiAssignments = \App\Models\AIGeneratedAssignment::whereIn('group_id', $groups->pluck('id'))
            ->with([
                'group',
                'assignment',
                'creator' => function($query) {
                    $query->select('id', 'name', 'email');
                }
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        // Get AI prompts for the user
        $aiPrompts = \App\Models\AIPrompt::where('user_id', $user->id)
            ->orWhereIn('group_id', $groups->pluck('id'))
            ->orderBy('created_at', 'desc')
            ->with(['user', 'group'])
            ->get();

        return Inertia::render('AI/Dashboard', [
            'groups' => $groups,
            'aiAssignments' => $aiAssignments,
            'aiPrompts' => $aiPrompts
        ]);
    }

    /**
     * Update an AI-generated assignment and optionally redistribute tasks
     */
    public function updateAssignment(Request $request, Group $group, GroupAssignment $assignment)
    {
        // Check if user is member of the group
        if (!$group->members()->where('user_id', Auth::id())->exists()) {
            return response()->json(['error' => 'You are not a member of this group'], 403);
        }

        // Check if assignment belongs to the group
        if ($assignment->group_id !== $group->id) {
            return response()->json(['error' => 'Assignment not found in this group'], 404);
        }

        // Log the request data for debugging
        Log::info('Update Assignment Request', [
            'data' => $request->all(),
            'tasks_type' => gettype($request->input('tasks')),
            'tasks_content' => $request->input('tasks')
        ]);

        // Validate request
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'unit_name' => 'required|string|max:255',
            'description' => 'required|string',
            'due_date' => 'required|date',
            'status' => 'required|in:active,completed,archived',
            'tasks' => 'required',
            'redistribute_tasks' => 'nullable|boolean',
        ]);

        try {
            // Parse tasks if they're sent as a JSON string
            $tasks = $validated['tasks'];
            if (is_string($tasks)) {
                $tasks = json_decode($tasks, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    return response()->json([
                        'error' => 'Invalid tasks JSON: ' . json_last_error_msg()
                    ], 422);
                }
            }

            DB::beginTransaction();

            // Update assignment
            $assignment->update([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'unit_name' => $validated['unit_name'],
                'due_date' => $validated['due_date'],
                'end_date' => $validated['due_date'],
                'status' => $validated['status'],
            ]);

            // Check if we need to redistribute tasks
            $redistributeTasks = $request->boolean('redistribute_tasks');
            if ($redistributeTasks) {
                // Get all group members using direct SQL to avoid relationship issues
                $groupMembers = \DB::table('users')
                    ->join('group_user', 'users.id', '=', 'group_user.user_id')
                    ->where('group_user.group_id', $group->id)
                    ->select('users.id', 'users.name')
                    ->get()
                    ->map(function($member) {
                    return [
                        'id' => $member->id,
                        'name' => $member->name
                    ];
                    })
                    ->toArray();

                // Check if there are any valid members to distribute tasks to
                if (empty($groupMembers)) {
                    DB::rollBack();
                    return response()->json([
                        'error' => 'Cannot distribute tasks: No valid group members found'
                    ], 400);
                }

                // Use the AIService to distribute tasks
                $distributedTasks = $this->aiService->distributeTasks($tasks, $groupMembers);

                // Update tasks with new assignments
                foreach ($distributedTasks as $task) {
                    $taskId = $task['id'];
                    $assignedUserId = $task['assigned_user_id'] ?? null;

                    // Find the task and update it
                    $taskModel = \App\Models\GroupTask::find($taskId);
                    if ($taskModel) {
                        $taskModel->update([
                            'assigned_user_id' => $assignedUserId
                        ]);
                    }
                }
            } else {
                // Update tasks individually
                foreach ($tasks as $taskData) {
                    $task = \App\Models\GroupTask::find($taskData['id']);
                    if ($task && $task->assignment_id === $assignment->id) {
                        $task->update([
                            'title' => $taskData['title'],
                            'description' => $taskData['description'],
                            'priority' => $taskData['priority'],
                            'effort_hours' => $taskData['effort_hours'],
                            'importance' => $taskData['importance'],
                            'assigned_user_id' => $taskData['assigned_user_id'],
                        ]);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Assignment and tasks updated successfully',
                'redirect_url' => route('group-assignments.show', ['group' => $group->id, 'assignment' => $assignment->id])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update AI assignment: ' . $e->getMessage());

            return response()->json([
                'error' => 'Failed to update assignment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show the form for editing an AI-generated assignment
     */
    public function editAssignment(Request $request, Group $group, GroupAssignment $assignment)
    {
        // Check if user is member of the group
        if (!$group->members()->where('user_id', Auth::id())->exists()) {
            return redirect()->route('groups.index')->with('error', 'You are not a member of this group');
        }

        // Check if assignment belongs to the group
        if ($assignment->group_id !== $group->id) {
            return redirect()->route('groups.show', $group)->with('error', 'Assignment not found in this group');
        }

        // Get the AI generated assignment data
        $aiGeneratedAssignment = \App\Models\AIGeneratedAssignment::where('assignment_id', $assignment->id)
            ->where('group_id', $group->id)
            ->first();

        if (!$aiGeneratedAssignment) {
            return redirect()->route('group-assignments.show', ['group' => $group->id, 'assignment' => $assignment->id])
                ->with('error', 'This is not an AI-generated assignment');
        }

        // Load the assignment with tasks
        $assignment->load(['tasks' => function($query) {
            $query->with('assignedUser:id,name');
        }]);

        // Return the edit view
        return Inertia::render('Groups/AIAssignmentEdit', [
            'group' => $group,
            'assignment' => $assignment,
            'aiGeneratedAssignment' => $aiGeneratedAssignment
        ]);
    }
}
