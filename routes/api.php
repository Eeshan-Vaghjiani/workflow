<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\API\ChatController;
use App\Http\Controllers\API\DirectMessageController;
use App\Http\Controllers\API\AITaskController;
use App\Http\Controllers\API\TaskController;
use App\Http\Controllers\API\AssignmentController;
use App\Http\Controllers\GroupChatController;
use App\Http\Controllers\PomodoroController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\API\GroupController;
use App\Http\Controllers\API\GroupMemberController;
use App\Http\Controllers\GroupAssignmentController;
use App\Http\Controllers\GroupTaskController;
use App\Http\Controllers\API\GroupChatController as APIGroupChatController;
use App\Http\Controllers\API\GroupMessageController;
use App\Http\Controllers\GroupChatController as GroupChatControllerWeb;
use App\Http\Controllers\API\TaskAssignmentController;
use App\Http\Controllers\API\SearchController;
use App\Http\Controllers\StudyPlannerController;
use App\Http\Controllers\CalendarController as CalendarControllerGroup;
use App\Http\Controllers\MpesaController;
use App\Http\Controllers\API\PricingController;
use App\Http\Controllers\API\PromptController;
use App\Http\Controllers\API\KanbanBoardController;
use App\Http\Controllers\API\KanbanColumnController;
use App\Http\Controllers\API\KanbanTaskController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Debug routes for authentication check (no auth required)
Route::get('/auth-check', function () {
    return response()->json([
        'message' => 'API is working',
        'auth_required' => true,
        'instructions' => 'Make sure to include your API token in the Authorization header.'
    ]);
});

// Debug route to check authentication status with detailed information
Route::get('/auth-status', function (Request $request) {
    $user = $request->user();
    $sessionData = [];

    if ($request->hasSession()) {
        $sessionData = [
            'has_session' => true,
            'session_id' => $request->session()->getId(),
            'session_token_exists' => $request->session()->has('_token'),
        ];
    } else {
        $sessionData = [
            'has_session' => false
        ];
    }

    return response()->json([
        'authenticated' => !is_null($user),
        'user' => $user,
        'session' => $sessionData,
        'cookies' => $request->cookies->all(),
        'headers' => [
            'authorization' => $request->header('Authorization'),
            'accept' => $request->header('Accept'),
            'content_type' => $request->header('Content-Type'),
            'user_agent' => $request->header('User-Agent'),
            'referer' => $request->header('Referer'),
        ]
    ]);
});

// New quick auth check route with simple solution advice
Route::middleware(['web'])->get('/auth-quick', function (Request $request) {
    // Try multiple auth guards to ensure we catch all authentication methods
    $user = $request->user() ?? Auth::user();
    $isAuthenticated = !is_null($user);

    if ($isAuthenticated) {
        return response()->json([
            'authenticated' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'message' => 'You are successfully authenticated.',
        ]);
    } else {
        return response()->json([
            'authenticated' => false,
            'message' => 'Authentication failed. Please ensure you\'re logged in.',
            'fix_suggestions' => [
                'Visit /login and log in again',
                'Clear your browser cookies and try again',
                'Make sure your session isn\'t expired',
                'Visit /auth-debug to troubleshoot'
            ]
        ], 401);
    }
});

// Public API routes
Route::middleware('auth:sanctum')->group(function () {
    // Authentication check route
    Route::get('/user', function (Request $request) {
        return response()->json([
            'user' => $request->user(),
            'token' => $request->bearerToken(),
            'message' => 'You are authenticated successfully.'
        ]);
    });

    // Groups
    Route::get('groups/search', [GroupController::class, 'search']);
    Route::get('groups', [GroupController::class, 'index']);
    Route::get('groups/{group}', [GroupController::class, 'show']);
    Route::post('groups', [GroupController::class, 'store']);
    Route::put('groups/{group}', [GroupController::class, 'update']);
    Route::delete('groups/{group}', [GroupController::class, 'destroy']);

    // Group Members
    Route::get('groups/{group}/members', [GroupMemberController::class, 'index']);
    Route::post('groups/{group}/members', [GroupMemberController::class, 'store']);
    Route::delete('groups/{group}/members/{user}', [GroupMemberController::class, 'destroy']);

    // Group Assignments
    Route::get('groups/{group}/assignments', [GroupAssignmentController::class, 'index']);
    Route::post('groups/{group}/assignments', [GroupAssignmentController::class, 'store']);
    Route::get('groups/{group}/assignments/{assignment}', [GroupAssignmentController::class, 'show']);
    Route::put('groups/{group}/assignments/{assignment}', [GroupAssignmentController::class, 'update']);
    Route::delete('groups/{group}/assignments/{assignment}', [GroupAssignmentController::class, 'destroy']);

    // Tasks
    Route::get('groups/{group}/assignments/{assignment}/tasks', [GroupTaskController::class, 'index']);
    Route::post('groups/{group}/assignments/{assignment}/tasks', [GroupTaskController::class, 'store']);
    Route::get('groups/{group}/assignments/{assignment}/tasks/{task}', [GroupTaskController::class, 'show']);
    Route::put('groups/{group}/assignments/{assignment}/tasks/{task}', [GroupTaskController::class, 'update']);
    Route::delete('groups/{group}/assignments/{assignment}/tasks/{task}', [GroupTaskController::class, 'destroy']);
    Route::post('groups/{group}/assignments/{assignment}/tasks/{task}/complete', [GroupTaskController::class, 'complete']);
    Route::post('groups/{group}/assignments/{assignment}/tasks/reorder', [GroupTaskController::class, 'reorder']);

    // Direct task updates (for Gantt chart and Kanban)
    Route::put('tasks/{task}', [TaskController::class, 'update']);
    Route::post('assignments/{assignment}/reorder-tasks', [TaskController::class, 'reorder']);

    // Group Chat
    Route::get('groups/{group}/messages', [GroupChatController::class, 'index']);
    Route::post('groups/{group}/messages', [GroupChatController::class, 'store']);
    Route::post('groups/{group}/read', [GroupChatController::class, 'markAsRead']);
    Route::post('groups/{group}/typing', [GroupChatController::class, 'typing']);

    // Direct Messages
    Route::get('/direct-messages', [DirectMessageController::class, 'index']);
    Route::get('/direct-messages/{userId}', [DirectMessageController::class, 'messages']);
    Route::post('/direct-messages/{userId}', [DirectMessageController::class, 'store']);
    Route::delete('/direct-messages/{messageId}', [DirectMessageController::class, 'destroy']);
    Route::post('/direct-messages/{userId}/read', [DirectMessageController::class, 'markAsRead']);

    // AI Task Creation
    Route::post('groups/{group}/ai/tasks', [AITaskController::class, 'createFromPrompt']);

    // AI Task Generation and Distribution
    Route::post('groups/{group}/ai-tasks/generate', [AITaskController::class, 'generateTasks']);
    Route::post('groups/{group}/assignments/ai-create', [AITaskController::class, 'createAssignment']);
    Route::post('groups/{group}/assignments/{assignment}/tasks/ai-create', [AITaskController::class, 'addTasksToAssignment']);
    Route::post('groups/{group}/ai-tasks/distribute', [AITaskController::class, 'autoDistributeTasks']);

    // AI Pricing and Prompts
    Route::get('/pricing', [PricingController::class, 'index']);
    Route::get('/pricing/{id}', [PricingController::class, 'show']);
    Route::post('/pricing/purchase', [PricingController::class, 'purchase']);
    Route::get('/user/prompts', [PromptController::class, 'getBalance']);
    Route::post('/ai/use-prompt', [PromptController::class, 'usePrompt']);

    // Auto-distribute tasks
    Route::post('groups/{groupId}/assignments/{assignmentId}/auto-distribute', [App\Http\Controllers\GroupTaskController::class, 'autoDistributeTasksAPI']);

    // Task assignment routes
    Route::get('groups/{groupId}/assignments/{assignmentId}/assignment-stats', [App\Http\Controllers\API\TaskAssignmentController::class, 'getAssignmentStats']);
    Route::post('groups/{groupId}/assignments/{assignmentId}/distribute-tasks', [App\Http\Controllers\API\TaskAssignmentController::class, 'autoDistributeTasks']);

    // Google Calendar API routes
    Route::post('/calendar/sync', [CalendarControllerGroup::class, 'sync']);

    // Calendar task date updates
    Route::put('/tasks/{id}', [App\Http\Controllers\API\TaskController::class, 'updateDates']);

    // Kanban Board Routes
    Route::middleware(\App\Http\Middleware\KanbanAuthMiddleware::class)->prefix('kanban')->group(function () {
        // Board Management
        Route::get('/boards', [KanbanBoardController::class, 'index']);
        Route::post('/boards', [KanbanBoardController::class, 'store']);
        Route::get('/boards/{board}', [KanbanBoardController::class, 'show']);
        Route::put('/boards/{board}', [KanbanBoardController::class, 'update']);
        Route::delete('/boards/{board}', [KanbanBoardController::class, 'destroy']);

        // Column Management
        Route::post('/columns', [KanbanColumnController::class, 'store']);
        Route::put('/columns/{column}', [KanbanColumnController::class, 'update']);
        Route::delete('/columns/{column}', [KanbanColumnController::class, 'destroy']);
        Route::put('/columns/reorder', [KanbanColumnController::class, 'reorder']);

        // Task Management
        Route::post('/tasks', [KanbanTaskController::class, 'store']);
        Route::put('/tasks/{task}', [KanbanTaskController::class, 'update']);
        Route::delete('/tasks/{task}', [KanbanTaskController::class, 'destroy']);
        Route::post('/tasks/{task}/move', [KanbanTaskController::class, 'move']);
        Route::put('/tasks/reorder', [KanbanTaskController::class, 'reorder']);
    });
});

// Direct route for Kanban boards with web middleware for easier authentication
Route::middleware(['web', \App\Http\Middleware\WebKanbanAuthMiddleware::class])->prefix('direct/kanban')->group(function () {
    // Board endpoints
    Route::get('/boards', [KanbanBoardController::class, 'index']);
    Route::get('/boards/{board}', [KanbanBoardController::class, 'show']);
    Route::post('/boards', [KanbanBoardController::class, 'store']);
    Route::put('/boards/{board}', [KanbanBoardController::class, 'update']);
    Route::delete('/boards/{board}', [KanbanBoardController::class, 'destroy']);

    // Column endpoints
    Route::post('/columns', [KanbanColumnController::class, 'store']);
    Route::put('/columns/{column}', [KanbanColumnController::class, 'update']);
    Route::delete('/columns/{column}', [KanbanColumnController::class, 'destroy']);
    Route::put('/columns/reorder', [KanbanColumnController::class, 'reorder']);

    // Task endpoints
    Route::post('/tasks', [KanbanTaskController::class, 'store']);
    Route::put('/tasks/{task}', [KanbanTaskController::class, 'update']);
    Route::delete('/tasks/{task}', [KanbanTaskController::class, 'destroy']);
    Route::post('/tasks/{task}/move', [KanbanTaskController::class, 'move']);
    Route::put('/tasks/reorder', [KanbanTaskController::class, 'reorder']);
});

// Direct route for users with web middleware
Route::middleware(['web', 'auth'])->get('/direct/users', function (Request $request) {
    return response()->json([
        'data' => \App\Models\User::select('id', 'name', 'avatar')->get()
    ]);
});

// Also add direct kanban routes with web middleware for better session handling
Route::middleware(['web', \App\Http\Middleware\WebKanbanAuthMiddleware::class])->group(function () {
    // Simplified board endpoints for direct web access
    Route::get('/web/kanban/boards', [KanbanBoardController::class, 'index']);
    Route::get('/web/kanban/boards/{board}', [KanbanBoardController::class, 'show']);
});

// Chat-specific API routes using web middleware for session auth
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/chat/groups', [ChatController::class, 'getGroups']);
    Route::get('/chat/groups/{group}/messages', [GroupChatController::class, 'getMessagesAPI']);
    Route::post('/chat/groups/{group}/messages', [GroupChatController::class, 'storeAPI']);
    Route::get('/chat/search-users', [ChatController::class, 'searchUsers']);

    Route::get('/direct-messages', [ChatController::class, 'getDirectMessages']);

    // New chat API endpoints
    Route::post('/groups', [GroupController::class, 'store']);
    Route::get('/groups/{group}/messages', [GroupMessageController::class, 'index']);
    Route::post('/groups/{group}/messages', [GroupMessageController::class, 'store']);
    Route::delete('/groups/{group}/messages/{message}', [GroupMessageController::class, 'destroy']);
    Route::post('/groups/{group}/read', [GroupMessageController::class, 'markAsRead']);

    // Enhanced group message features
    Route::post('/groups/{group}/messages/{message}/reply', [GroupMessageController::class, 'reply']);
    Route::post('/groups/{group}/messages/{message}/pin', [GroupMessageController::class, 'pin']);
    Route::delete('/groups/{group}/messages/{message}/pin', [GroupMessageController::class, 'unpin']);
    Route::get('/groups/{group}/pinned', [GroupMessageController::class, 'getPinnedMessages']);
    Route::post('/groups/{group}/search', [GroupMessageController::class, 'search']);
    Route::post('/groups/{group}/messages/attachments', [GroupMessageController::class, 'uploadAttachment']);

    // Enhanced direct message endpoints
    Route::get('/direct-messages', [DirectMessageController::class, 'index']);
    Route::get('/direct-messages/{userId}', [DirectMessageController::class, 'messages']);
    Route::post('/direct-messages/{userId}', [DirectMessageController::class, 'store']);
    Route::delete('/direct-messages/{messageId}', [DirectMessageController::class, 'destroy']);
    Route::post('/direct-messages/{userId}/read', [DirectMessageController::class, 'markAsRead']);

    // Enhanced direct message features
    Route::post('/direct-messages/{messageId}/reply', [DirectMessageController::class, 'reply']);
    Route::post('/direct-messages/{messageId}/pin', [DirectMessageController::class, 'pin']);
    Route::delete('/direct-messages/{messageId}/pin', [DirectMessageController::class, 'unpin']);
    Route::get('/direct-messages/{userId}/pinned', [DirectMessageController::class, 'getPinnedMessages']);
    Route::post('/direct-messages/{userId}/search', [DirectMessageController::class, 'search']);
    Route::post('/direct-messages/attachments', [DirectMessageController::class, 'uploadAttachment']);

});

Route::middleware([
    'auth:sanctum',
    config('jetstream.auth_middleware'),
    'verified'
])->group(function () {
    Route::get('/dashboard', function () {
        return view('dashboard');
    })->name('api.dashboard');
});

// Tasks API
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::put('/tasks/{id}', [TaskController::class, 'update']);
    Route::delete('/tasks/{id}', [TaskController::class, 'destroy']);
});

// Group messages API
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/groups/{group}/messages', [GroupChatControllerWeb::class, 'getMessagesAPI']);
    Route::post('/groups/{group}/messages', [GroupChatControllerWeb::class, 'storeAPI']);
});

// Add a public endpoint for AI tasks (no auth required)
Route::post('/no-auth/ai/tasks', function(Illuminate\Http\Request $request) {
    $aiService = app(App\Services\AIService::class);

    try {
        // Validate the request
        $validated = $request->validate([
            'prompt' => 'required|string|min:5',
            'group_id' => 'required|integer',
        ]);

        // Use default values since we're bypassing authentication
        $userId = $request->input('user_id', 1); // Default user ID
        $groupId = $request->input('group_id');

        // Check if group exists
        $group = \App\Models\Group::find($groupId);
        if (!$group) {
            return response()->json([
                'success' => false,
                'error' => 'Group not found',
                'group_id' => $groupId,
            ], 404);
        }

        // Log the AI request parameters
        \Illuminate\Support\Facades\Log::info('AI Task Request', [
            'prompt' => $request->prompt,
            'group_id' => $groupId,
            'user_id' => $userId
        ]);

        // Process prompt with AI service
        $aiResponse = $aiService->processTaskPrompt($request->prompt, $userId, $groupId);

        // Check if AI processing encountered an error
        if (isset($aiResponse['error'])) {
            \Illuminate\Support\Facades\Log::error('AI Service Error', [
                'error' => $aiResponse['error'],
                'debug' => $aiResponse['debug'] ?? null
            ]);

            return response()->json([
                'success' => false,
                'error' => 'AI Service Error: ' . $aiResponse['error'],
                'debug' => $aiResponse['debug'] ?? null
            ], 500);
        }

        \Illuminate\Support\Facades\Log::info('AI Response', [
            'assignment_title' => $aiResponse['assignment']['title'] ?? 'No title',
            'tasks_count' => count($aiResponse['tasks'] ?? [])
        ]);

        // Validate and prepare the AI response for database insertion
        if (!isset($aiResponse['assignment']) || !isset($aiResponse['tasks']) || empty($aiResponse['tasks'])) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid AI response structure',
                'data' => $aiResponse
            ], 500);
        }

        try {
            \Illuminate\Support\Facades\DB::beginTransaction();

            // Create the assignment
            $assignment = \App\Models\GroupAssignment::create([
                'group_id' => $groupId,
                'title' => $aiResponse['assignment']['title'],
                'unit_name' => $aiResponse['assignment']['unit_name'] ?? 'General',
                'description' => $aiResponse['assignment']['description'] ?? '',
                'start_date' => now(),
                'end_date' => isset($aiResponse['assignment']['due_date']) ? $aiResponse['assignment']['due_date'] : now()->addWeeks(2),
                'due_date' => isset($aiResponse['assignment']['due_date']) ? $aiResponse['assignment']['due_date'] : now()->addWeeks(2),
                'status' => 'active',
                'created_by' => $userId,
            ]);

            // Get the model used
            $modelUsed = $aiService->getWorkingModel();

            // Create an entry in the AI generated assignments table
            $aiGeneratedAssignment = \App\Models\AIGeneratedAssignment::create([
                'group_id' => $groupId,
                'assignment_id' => $assignment->id,
                'original_prompt' => $request->prompt,
                'ai_response' => json_encode($aiResponse),
                'model_used' => $modelUsed,
                'created_by' => $userId,
            ]);

            // Create tasks
            $createdTasks = [];
            foreach ($aiResponse['tasks'] as $taskData) {
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

                // Default dates if not provided
                $startDate = $taskData['start_date'] ?? now();
                $endDate = $taskData['end_date'] ?? now()->addDays(7);

                $task = \App\Models\GroupTask::create([
                    'assignment_id' => $assignment->id,
                    'title' => $taskData['title'],
                    'description' => $taskData['description'],
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'status' => 'pending',
                    'priority' => $taskData['priority'] ?? 'medium',
                    'effort_hours' => $taskData['effort_hours'] ?? 1,
                    'importance' => $taskData['importance'] ?? 3,
                    'assigned_user_id' => $assignedUserId,
                    'created_by' => $userId,
                ]);

                $createdTasks[] = $task;
            }

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'success' => true,
                'assignment' => $assignment,
                'tasks' => $createdTasks,
                'message' => 'Successfully created assignment and tasks from prompt'
            ], 201);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Failed to create tasks from prompt', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to create tasks: ' . $e->getMessage(),
                'trace' => explode("\n", $e->getTraceAsString())
            ], 500);
        }
    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'success' => false,
            'error' => 'Validation error',
            'errors' => $e->errors(),
        ], 422);
    } catch (\Exception $e) {
        \Illuminate\Support\Facades\Log::error('Unexpected error in AI tasks endpoint', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);

        return response()->json([
            'success' => false,
            'error' => 'Error processing AI request: ' . $e->getMessage(),
            'trace' => explode("\n", $e->getTraceAsString())
        ], 500);
    }
});

// Add a no-auth test route for AI tasks
Route::post('test-ai-tasks', function(Illuminate\Http\Request $request) {
    $aiService = app(App\Services\AIService::class);

    $validated = $request->validate([
        'prompt' => 'required|string|min:5|max:1000',
    ]);

    try {
        $result = $aiService->processTaskPrompt($request->prompt, 1, 1);
        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => 'AI response generated without authentication'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => 'Error processing AI request: ' . $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

// Add a test endpoint for OpenRouter API
Route::get('/test-openrouter-connection', function() {
    $aiService = app(App\Services\AIService::class);
    $result = $aiService->testConnection();

    if ($result['success']) {
        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'response' => $result['response']
        ]);
    } else {
        return response()->json([
            'success' => false,
            'error' => $result['error'],
            'details' => $result['response'] ?? null
        ], 500);
    }
});

// Add a debug endpoint for chat system
Route::get('/chat-test', function() {
    return response()->json([
        'success' => true,
        'status' => 'Chat system is accessible',
        'echo_config' => [
            'broadcaster' => config('broadcasting.default'),
            'key' => config('broadcasting.connections.pusher.key'),
            'cluster' => config('broadcasting.connections.pusher.options.cluster'),
        ],
        'channels' => [
            'private' => 'Private channels should be working',
            'presence' => 'Presence channels should be working',
        ]
    ]);
});

// Add a debug endpoint for sending test messages
Route::post('/chat-test', function(Illuminate\Http\Request $request) {
    $validated = $request->validate([
        'event' => 'required|string',
        'message' => 'required|string',
    ]);

    try {
        // For private channel testing
        if ($request->has('channel_type') && $request->input('channel_type') === 'private') {
            $userId = $request->input('user_id', auth()->id() ?: 1);
            broadcast(new \App\Events\NewDirectMessage(
                new \App\Models\DirectMessage([
                    'sender_id' => auth()->id() ?: 1,
                    'receiver_id' => $userId,
                    'message' => $validated['message'],
                    'read' => false,
                ]),
                [
                    'content' => $validated['message'],
                    'timestamp' => date('h:i A'),
                    'date' => date('M j, Y'),
                    'id' => time(),
                    'sender' => auth()->user() ? [
                        'id' => auth()->id(),
                        'name' => auth()->user()->name
                    ] : ['id' => 1, 'name' => 'Test User'],
                ]
            ));
        }
        // For group channel testing
        else {
            $groupId = $request->input('group_id', 1);
            broadcast(new \App\Events\NewGroupMessage(
                $groupId,
                [
                    'id' => time(),
                    'content' => $validated['message'],
                    'sender' => auth()->user() ? [
                        'id' => auth()->id(),
                        'name' => auth()->user()->name
                    ] : ['id' => 1, 'name' => 'Test User'],
                    'timestamp' => date('h:i A'),
                    'date' => date('M j, Y'),
                    'is_system_message' => false,
                ]
            ));
        }

        return response()->json([
            'success' => true,
            'message' => 'Test message broadcast successfully',
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => 'Failed to broadcast message: ' . $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

// Function to sanitize and validate dates in AI response
if (!function_exists('sanitizeAiResponseDates')) {
    function sanitizeAiResponseDates($response) {
        if (isset($response['assignment'])) {
            // Ensure dates are in correct format or set defaults
            $now = now();
            if (!isset($response['assignment']['due_date']) || !validateDate($response['assignment']['due_date'])) {
                $response['assignment']['due_date'] = $now->addDays(14)->format('Y-m-d');
            }
            if (!isset($response['assignment']['start_date']) || !validateDate($response['assignment']['start_date'])) {
                $response['assignment']['start_date'] = $now->format('Y-m-d');
            }
            if (!isset($response['assignment']['end_date']) || !validateDate($response['assignment']['end_date'])) {
                $response['assignment']['end_date'] = $now->addDays(14)->format('Y-m-d');
            }
        }

        if (isset($response['tasks']) && is_array($response['tasks'])) {
            foreach ($response['tasks'] as $key => $task) {
                $now = now();

                // Validate task has required fields
                if (!isset($task['title']) || empty($task['title'])) {
                    $response['tasks'][$key]['title'] = 'Task ' . ($key + 1);
                }

                // Sanitize dates
                if (!isset($task['start_date']) || !validateDate($task['start_date'])) {
                    $response['tasks'][$key]['start_date'] = $now->format('Y-m-d');
                }

                if (!isset($task['end_date']) || !validateDate($task['end_date'])) {
                    $response['tasks'][$key]['end_date'] = $now->addDays(7)->format('Y-m-d');
                }

                // Sanitize priority
                if (!isset($task['priority']) || !in_array($task['priority'], ['low', 'medium', 'high'])) {
                    $response['tasks'][$key]['priority'] = 'medium';
                }
            }
        }

        return $response;
    }
}

// Helper function to validate a date string
if (!function_exists('validateDate')) {
    function validateDate($date, $format = 'Y-m-d') {
        if (!is_string($date)) return false;

        $d = \DateTime::createFromFormat($format, $date);
        return $d && $d->format($format) === $date;
    }
}

// Dashboard chat routes
Route::middleware(['auth:sanctum'])->prefix('web')->group(function () {
    Route::get('/groups/{group}/messages', [App\Http\Controllers\GroupChatController::class, 'getMessagesAPI']);
    Route::post('/groups/{group}/messages', [App\Http\Controllers\GroupChatController::class, 'storeAPI']);
});

// Add a route to check auth status
Route::get('/auth/check', function(Request $request) {
    if (Auth::check()) {
        return response()->json([
            'authenticated' => true,
            'user' => $request->user(),
            'session_active' => true,
            'session_id' => session()->getId(),
        ]);
    }

    return response()->json([
        'authenticated' => false,
        'session_active' => $request->hasSession() && session()->isStarted(),
        'cookies_received' => count($request->cookies->all()) > 0,
        'session_id' => session()->getId(),
    ], 401);
})->middleware(['web']);

// Add direct web authenticated routes for assignment stats
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('groups/{groupId}/assignments/{assignmentId}/assignment-stats', [App\Http\Controllers\API\TaskAssignmentController::class, 'getAssignmentStats']);
    Route::post('groups/{groupId}/assignments/{assignmentId}/distribute-tasks', [App\Http\Controllers\API\TaskAssignmentController::class, 'autoDistributeTasks']);
});

// Study Planner API Routes
Route::middleware(['auth:sanctum'])->group(function () {
    // Study Planner API routes with /web prefix for better session handling
    Route::get('/web/study-sessions', [StudyPlannerController::class, 'getSessions']);
    Route::get('/web/study-tasks', [StudyPlannerController::class, 'getTasks']);
    Route::post('/web/study-sessions', [StudyPlannerController::class, 'storeSession']);
    Route::put('/web/study-sessions/{session}', [StudyPlannerController::class, 'updateSession']);
    Route::delete('/web/study-sessions/{session}', [StudyPlannerController::class, 'deleteSession']);
    Route::post('/web/study-tasks', [StudyPlannerController::class, 'storeTask']);
    Route::put('/web/study-tasks/{task}', [StudyPlannerController::class, 'updateTask']);
    Route::delete('/web/study-tasks/{task}', [StudyPlannerController::class, 'deleteTask']);

    // Original routes without /web prefix for backward compatibility
    Route::get('/study-sessions', [StudyPlannerController::class, 'getSessions']);
    Route::get('/study-tasks', [StudyPlannerController::class, 'getTasks']);
    Route::post('/study-sessions', [StudyPlannerController::class, 'storeSession']);
    Route::put('/study-sessions/{session}', [StudyPlannerController::class, 'updateSession']);
    Route::delete('/study-sessions/{session}', [StudyPlannerController::class, 'deleteSession']);
    Route::post('/study-tasks', [StudyPlannerController::class, 'storeTask']);
    Route::put('/study-tasks/{task}', [StudyPlannerController::class, 'updateTask']);
    Route::delete('/study-tasks/{task}', [StudyPlannerController::class, 'deleteTask']);
});

// Add web-middleware fallback routes for Study Planner to ensure session auth works
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/api/web/study-sessions', [StudyPlannerController::class, 'getSessions']);
    Route::get('/api/web/study-tasks', [StudyPlannerController::class, 'getTasks']);
    Route::post('/api/web/study-sessions', [StudyPlannerController::class, 'storeSession']);
    Route::put('/api/web/study-sessions/{session}', [StudyPlannerController::class, 'updateSession']);
    Route::delete('/api/web/study-sessions/{session}', [StudyPlannerController::class, 'deleteSession']);
    Route::post('/api/web/study-tasks', [StudyPlannerController::class, 'storeTask']);
    Route::put('/api/web/study-tasks/{task}', [StudyPlannerController::class, 'updateTask']);
    Route::delete('/api/web/study-tasks/{task}', [StudyPlannerController::class, 'deleteTask']);
});

// Pomodoro Timer API Routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/web/pomodoro/settings', [\App\Http\Controllers\PomodoroController::class, 'updateSettings']);
    Route::get('/web/pomodoro/settings/{userId?}', [\App\Http\Controllers\PomodoroController::class, 'getUserSettings']);
    Route::post('/web/pomodoro/sessions', [\App\Http\Controllers\PomodoroController::class, 'recordSession']);
    Route::get('/web/pomodoro/stats', [\App\Http\Controllers\PomodoroController::class, 'getStats']);

    // Fallback routes without /web prefix for compatibility
    Route::post('/pomodoro/settings', [\App\Http\Controllers\PomodoroController::class, 'updateSettings']);
    Route::get('/pomodoro/settings/{userId?}', [\App\Http\Controllers\PomodoroController::class, 'getUserSettings']);
    Route::post('/pomodoro/sessions', [\App\Http\Controllers\PomodoroController::class, 'recordSession']);
    Route::get('/pomodoro/stats', [\App\Http\Controllers\PomodoroController::class, 'getStats']);
});

// M-Pesa API Routes
Route::post('/mpesa/stkpush', [MpesaController::class, 'stkPush'])->name('api.mpesa.stkpush');
Route::post('/mpesa/check-status', [MpesaController::class, 'checkStatus'])->name('api.mpesa.check-status');
Route::get('/mpesa', [MpesaController::class, 'index'])->name('api.mpesa.index');

// M-Pesa callback URL (no auth required as it's called by Safaricom)
Route::post('/mpesa/callback', [MpesaController::class, 'callback'])->name('api.mpesa.callback');

// Test routes
Route::get('/broadcast-test', [App\Http\Controllers\API\ChatController::class, 'testBroadcast']);
Route::post('/broadcast-test', [App\Http\Controllers\API\ChatController::class, 'testBroadcast']);

// Contact form submission
Route::post('/contact', function (Request $request) {
    $validated = $request->validate([
        'name' => 'required|string|max:100',
        'email' => 'required|email|max:100',
        'message' => 'required|string|max:2000',
    ]);

    // Here you would typically send an email or store in the database
    // For now, we'll just return a success response

    return response()->json(['success' => true, 'message' => 'Thank you for your message. We will get back to you soon.']);
});

// Debug route to test Kanban board authentication
Route::middleware('auth:sanctum')->get('/debug/kanban-auth', function (Request $request) {
    $user = $request->user();

    // Test fetching kanban boards
    $boards = App\Models\KanbanBoard::where('created_by', $user->id)->get();

    return response()->json([
        'authenticated' => true,
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ],
        'boards_count' => $boards->count(),
        'has_boards' => $boards->count() > 0,
        'boards' => $boards,
        'message' => 'Authentication is working correctly.',
    ]);
});

// Add a debug endpoint to test Kanban authentication directly
Route::get('/debug/kanban-auth-test', function (Request $request) {
    try {
        $user = Auth::user() ?? $request->user();
        $userData = null;

        if ($user) {
            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_admin' => (bool)$user->is_admin,
            ];
        }

        return response()->json([
            'authenticated' => !is_null($user),
            'user' => $userData,
            'request_info' => [
                'path' => $request->path(),
                'method' => $request->method(),
                'is_ajax' => $request->ajax(),
                'wants_json' => $request->wantsJson(),
                'expects_json' => $request->expectsJson(),
            ],
            'session' => [
                'has_session' => $request->hasSession(),
                'session_id' => $request->hasSession() ? $request->session()->getId() : null,
            ],
            'guards' => [
                'web' => Auth::guard('web')->check(),
                'api' => Auth::guard('api')->check(),
                'sanctum' => Auth::guard('sanctum')->check(),
            ],
        ]);
    } catch (\Exception $e) {
        \Illuminate\Support\Facades\Log::error('API Kanban Auth Debug Error: ' . $e->getMessage(), [
            'trace' => $e->getTraceAsString(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);

        // Return a simplified response that won't cause errors
        return response()->json([
            'authenticated' => Auth::check(),
            'error' => 'Error retrieving kanban auth details: ' . $e->getMessage(),
            'user' => Auth::check() ? [
                'id' => Auth::id(),
                'is_admin' => Auth::user() ? (bool)Auth::user()->is_admin : false
            ] : null
        ]);
    }
});

// Admin User Management API
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    // User management
    Route::get('/users', [App\Http\Controllers\API\UserController::class, 'index']);
    Route::post('/users', [App\Http\Controllers\API\UserController::class, 'store']);
    Route::put('/users/{id}', [App\Http\Controllers\API\UserController::class, 'update']);
    Route::delete('/users/{id}', [App\Http\Controllers\API\UserController::class, 'destroy']);
    Route::post('/users/{id}/restore', [App\Http\Controllers\API\UserController::class, 'restore']);
    Route::get('/users/pdf', [App\Http\Controllers\API\UserController::class, 'generatePdf']);
});
