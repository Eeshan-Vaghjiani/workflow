<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\GroupAssignment;
use App\Models\GroupTask;
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

        return Inertia::render('Groups/AITaskAssignment', [
            'group' => [
                'id' => $group->id,
                'name' => $group->name,
                'members' => $members
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

        return Inertia::render('Groups/AITaskAssignment', [
            'group' => [
                'id' => $group->id,
                'name' => $group->name,
                'members' => $members
            ],
            'assignment' => [
                'id' => $assignment->id,
                'title' => $assignment->title
            ]
        ]);
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
                'group_id' => $group->id,
            ]);

            $result = $this->aiService->processTaskPrompt(
                $request->prompt,
                Auth::id(),
                $group->id
            );

            if (isset($result['error'])) {
                Log::error('AI Task Generation: Service error', [
                    'error' => $result['error'],
                    'user_id' => Auth::id(),
                    'group_id' => $group->id,
                ]);

                return response()->json(['error' => $result['error']], 500);
            }

            // Log successful processing
            Log::info('AI Task Generation: Successful processing', [
                'user_id' => Auth::id(),
                'group_id' => $group->id,
                'task_count' => count($result['tasks'] ?? []),
            ]);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('AI Task Generation: Exception', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'user_id' => Auth::id(),
                'group_id' => $group->id,
            ]);

            return response()->json([
                'error' => 'Failed to process task prompt: ' . $e->getMessage(),
                'trace' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    /**
     * Create a new assignment with tasks using AI-generated data
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
        ]);

        try {
            // Start transaction
            DB::beginTransaction();

            // Create assignment
            $assignment = GroupAssignment::create([
                'group_id' => $group->id,
                'title' => $validated['assignment']['title'],
                'unit_name' => $validated['assignment']['unit_name'],
                'description' => $validated['assignment']['description'],
                'start_date' => date('Y-m-d'),
                'end_date' => $validated['assignment']['due_date'],
                'due_date' => $validated['assignment']['due_date'],
                'status' => 'active',
                'created_by' => Auth::id(),
            ]);

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

                GroupTask::create([
                    'assignment_id' => $assignment->id,
                    'title' => $taskData['title'],
                    'description' => $taskData['description'],
                    'start_date' => $taskData['start_date'],
                    'end_date' => $taskData['end_date'],
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

                GroupTask::create([
                    'assignment_id' => $assignment->id,
                    'title' => $taskData['title'],
                    'description' => $taskData['description'],
                    'start_date' => $taskData['start_date'],
                    'end_date' => $taskData['end_date'],
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
     * Distribute tasks among group members using AI
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
            'tasks.*.id' => 'nullable|integer',
            'tasks.*.title' => 'required|string',
            'tasks.*.effort_hours' => 'required|numeric|min:1',
            'tasks.*.importance' => 'required|integer|min:1|max:5',
            'members' => 'required|array',
            'members.*.id' => 'required|integer',
            'members.*.name' => 'required|string',
        ]);

        try {
            // Process task distribution with AI
            $distributedTasks = $this->aiService->distributeTasks(
                $validated['tasks'],
                $validated['members']
            );

            return response()->json([
                'success' => true,
                'tasks' => $distributedTasks
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

        return Inertia::render('AI/Dashboard', [
            'groups' => $groups,
            'aiAssignments' => $aiAssignments
        ]);
    }
}
