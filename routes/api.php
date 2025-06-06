<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\GroupController;
use App\Http\Controllers\API\GroupMemberController;
use App\Http\Controllers\API\GroupAssignmentController;
use App\Http\Controllers\API\GroupTaskController;
use App\Http\Controllers\API\TaskController;
use App\Http\Controllers\API\GroupChatController;
use App\Http\Controllers\API\GroupMessageController;
use App\Http\Controllers\API\DirectMessageController;
use App\Http\Controllers\API\AITaskController;
use App\Http\Controllers\GroupChatController as GroupChatControllerGroup;
use App\Http\Controllers\API\ChatController;
use App\Http\Controllers\API\TaskAssignmentController;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\API\SearchController;

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
Route::get('/auth-quick', function (Request $request) {
    $user = $request->user();
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
    Route::get('direct-messages', [DirectMessageController::class, 'index']);
    Route::get('direct-messages/{user}', [DirectMessageController::class, 'messages']);
    Route::post('direct-messages/{user}', [DirectMessageController::class, 'store']);
    Route::post('direct-messages/{user}/read', [DirectMessageController::class, 'markAsRead']);
    Route::post('direct-messages/{user}/typing', [DirectMessageController::class, 'typing']);
    
    // AI Task Creation
    Route::post('groups/{group}/ai/tasks', [AITaskController::class, 'createFromPrompt']);
    
    // Auto-distribute tasks
    Route::post('groups/{groupId}/assignments/{assignmentId}/auto-distribute', [App\Http\Controllers\GroupTaskController::class, 'autoDistributeTasksAPI']);
    
    // Task assignment routes
    Route::get('groups/{groupId}/assignments/{assignmentId}/assignment-stats', [App\Http\Controllers\API\TaskAssignmentController::class, 'getAssignmentStats']);
    Route::post('groups/{groupId}/assignments/{assignmentId}/distribute-tasks', [App\Http\Controllers\API\TaskAssignmentController::class, 'autoDistributeTasks']);
});

// Chat-specific API routes using web middleware for session auth
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/chat/groups', [ChatController::class, 'getGroups']);
    Route::get('/chat/search-users', [ChatController::class, 'searchUsers']);
    Route::get('/direct-messages', [ChatController::class, 'getDirectMessages']);
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
    Route::get('/groups/{group}/messages', [GroupChatControllerGroup::class, 'getMessagesAPI']);
    Route::post('/groups/{group}/messages', [GroupChatControllerGroup::class, 'storeAPI']);
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
        
        // Sanitize dates and ensure all required fields exist
        $aiResponse = sanitizeAiResponseDates($aiResponse);
        
        // Begin transaction to create assignment and tasks
        try {
            \Illuminate\Support\Facades\DB::beginTransaction();
            
            // Create the assignment
            $assignment = \App\Models\GroupAssignment::create([
                'group_id' => $groupId,
                'title' => $aiResponse['assignment']['title'],
                'unit_name' => $aiResponse['assignment']['unit_name'] ?? 'General',
                'description' => $aiResponse['assignment']['description'] ?? '',
                'start_date' => $aiResponse['assignment']['start_date'] ?? now(),
                'end_date' => $aiResponse['assignment']['end_date'] ?? now()->addWeeks(2),
                'due_date' => $aiResponse['assignment']['due_date'] ?? now()->addWeeks(2),
                'priority' => $aiResponse['assignment']['priority'] ?? 'medium',
                'status' => 'active',
                'created_by' => $userId,
            ]);

            // Process tasks
            $createdTasks = [];
            foreach ($aiResponse['tasks'] as $taskData) {
                // Find user by name if assigned_to_name is provided
                $assignedUserId = $userId; // Default to the current user
                if (isset($taskData['assigned_to_name'])) {
                    $assignedUser = \App\Models\User::whereHas('groups', function ($query) use ($groupId) {
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
                $task = \App\Models\GroupTask::create([
                    'assignment_id' => $assignment->id,
                    'title' => $taskData['title'],
                    'description' => $taskData['description'] ?? '',
                    'assigned_to' => $assignedUserId,
                    'start_date' => $taskData['start_date'] ?? now(),
                    'end_date' => $taskData['end_date'] ?? now()->addWeeks(1),
                    'status' => 'pending',
                    'priority' => $taskData['priority'] ?? 'medium',
                    'created_by' => $userId,
                    'order_index' => count($createdTasks),
                ]);

                $task->load('assignedUser');
                $createdTasks[] = $task;
            }

            \Illuminate\Support\Facades\DB::commit();

            // Return the created assignment and tasks
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

// Helper function to validate a date string
function validateDate($date, $format = 'Y-m-d') {
    if (!is_string($date)) return false;
    
    $d = \DateTime::createFromFormat($format, $date);
    return $d && $d->format($format) === $date;
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
