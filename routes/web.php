<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\GroupMemberController;
use App\Http\Controllers\GroupAssignmentController;
use App\Http\Controllers\GroupTaskController;
use App\Http\Controllers\GroupChatController;
use App\Http\Controllers\DirectMessageController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ChatController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

// Add authentication debugger page
Route::get('/auth-debug', function () {
    return Inertia::render('AuthDebug');
})->name('auth.debug');

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/calendar', [DashboardController::class, 'calendar'])->name('dashboard.calendar');
    Route::get('/dashboard/gantt', [DashboardController::class, 'gantt'])->name('dashboard.gantt');

    // Simple redirects for Dashboard links
    Route::get('/calendar', function() { return redirect('/dashboard/calendar'); });
    
    // Dynamic group assignments redirect - uses first group the user is a member of
    Route::get('/group-assignments', function() { 
        // Get the first group the user is a member of, or redirect to groups list if none
        $user = auth()->user();
        $group = $user->groups()->first();
        
        if ($group) {
            return redirect()->route('group-assignments.index', ['group' => $group->id]);
        } else {
            return redirect()->route('groups.index')->with('error', 'You need to join a group first.');
        }
    });
    
    // Dynamic assignments redirect - uses first group the user is a member of
    Route::get('/assignments', function() { 
        // Get the first group the user is a member of, or redirect to groups list if none
        $user = auth()->user();
        $group = $user->groups()->first();
        
        if ($group) {
            return redirect()->route('group-assignments.index', ['group' => $group->id]);
        } else {
            return redirect()->route('groups.index')->with('error', 'You need to join a group first.');
        }
    });
    Route::get('/tasks', [DashboardController::class, 'tasks'])->name('group-tasks.index');
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/mark-as-read', [NotificationController::class, 'markAsRead'])->name('notifications.mark-as-read');
    Route::post('/notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-as-read');

    // Groups
    Route::get('/groups', [GroupController::class, 'index'])->name('groups.index');
    Route::get('/groups/create', [GroupController::class, 'create'])->name('groups.create');
    Route::get('/groups/joinable', [GroupController::class, 'joinable'])->name('groups.joinable');
    Route::post('/groups', [GroupController::class, 'store'])->name('groups.store');
    Route::get('/groups/{group}', [GroupController::class, 'show'])->name('groups.show');
    Route::get('/groups/{group}/edit', [GroupController::class, 'edit'])->name('groups.edit');
    Route::put('/groups/{group}', [GroupController::class, 'update'])->name('groups.update');
    Route::delete('/groups/{group}', [GroupController::class, 'destroy'])->name('groups.destroy');
    Route::post('/groups/{group}/join', [GroupController::class, 'requestJoin'])->name('groups.request-join');
    Route::post('/groups/{group}/approve-join', [GroupController::class, 'approveJoinRequest'])->name('groups.approve-join');
    Route::post('/groups/{group}/reject-join', [GroupController::class, 'rejectJoinRequest'])->name('groups.reject-join');

    // Group Members
    Route::get('/groups/{group}/members', [GroupMemberController::class, 'index'])->name('groups.members.index');
    Route::get('/groups/{group}/members/invite', [GroupMemberController::class, 'invite'])->name('groups.members.invite');
    Route::post('/groups/{group}/members', [GroupMemberController::class, 'store'])->name('groups.members.store');
    Route::delete('/groups/{group}/members/{member}', [GroupMemberController::class, 'destroy'])->name('groups.members.destroy');
    Route::get('/groups/{group}/search-users', [GroupMemberController::class, 'searchUsers'])->name('groups.members.search');

    // Group Assignments
    Route::get('/groups/{group}/assignments', [GroupAssignmentController::class, 'index'])->name('group-assignments.index');
    Route::get('/groups/{group}/assignments/create', [GroupAssignmentController::class, 'create'])->name('group-assignments.create');
    Route::post('/groups/{group}/assignments', [GroupAssignmentController::class, 'store'])->name('group-assignments.store');
    Route::get('/groups/{group}/assignments/{assignment}', [GroupAssignmentController::class, 'show'])->name('group-assignments.show');
    Route::get('/groups/{group}/assignments/{assignment}/edit', [GroupAssignmentController::class, 'edit'])->name('group-assignments.edit');
    Route::put('/groups/{group}/assignments/{assignment}', [GroupAssignmentController::class, 'update'])->name('group-assignments.update');
    Route::delete('/groups/{group}/assignments/{assignment}', [GroupAssignmentController::class, 'destroy'])->name('group-assignments.destroy');

    // Group Tasks
    Route::get('/tasks', [GroupTaskController::class, 'index'])->name('group-tasks.index');
    Route::post('/tasks/{task}/complete', [GroupTaskController::class, 'completeSimple'])->name('group-tasks.complete-simple');
    Route::get('/tasks/create', [GroupTaskController::class, 'create'])->name('group-tasks.create');
    Route::get('/tasks/{task}/edit', [GroupTaskController::class, 'edit'])->name('group-tasks.edit-simple');
    Route::put('/tasks/{task}', [GroupTaskController::class, 'update'])->name('group-tasks.update-simple');
    
    Route::get('/groups/{group}/assignments/{assignment}/tasks', [GroupTaskController::class, 'index'])->name('group-tasks.index-nested');
    Route::post('/groups/{group}/assignments/{assignment}/tasks', [GroupTaskController::class, 'store'])->name('group-tasks.store');
    Route::get('/groups/{group}/assignments/{assignment}/tasks/{task}', [GroupTaskController::class, 'show'])->name('group-tasks.show');
    Route::get('/groups/{group}/assignments/{assignment}/tasks/{task}/edit', [GroupTaskController::class, 'edit'])->name('group-tasks.edit');
    Route::put('/groups/{group}/assignments/{assignment}/tasks/{task}', [GroupTaskController::class, 'update'])->name('group-tasks.update');
    Route::delete('/groups/{group}/assignments/{assignment}/tasks/{task}', [GroupTaskController::class, 'destroy'])->name('group-tasks.destroy');
    Route::post('/groups/{group}/assignments/{assignment}/tasks/{task}/complete', [GroupTaskController::class, 'complete'])->name('group-tasks.complete');
    Route::post('/groups/{group}/assignments/{assignment}/tasks/reorder', [GroupTaskController::class, 'reorder'])->name('group-tasks.reorder');

    // Group Chat
    Route::get('/groups/{group}/chat', [GroupChatController::class, 'index'])->name('group-chat.index');
    Route::post('/groups/{group}/chat', [GroupChatController::class, 'store'])->name('group-chat.store');
    Route::get('/groups/{group}/chat/{message}', [GroupChatController::class, 'show'])->name('group-chat.show');
    Route::put('/groups/{group}/chat/{message}', [GroupChatController::class, 'update'])->name('group-chat.update');
    Route::delete('/groups/{group}/chat/{message}', [GroupChatController::class, 'destroy'])->name('group-chat.destroy');

    // Chat Routes  
    Route::get('/chat/search-users', [ChatController::class, 'searchUsers'])->name('chat.search-users');
    Route::get('/chat', [GroupChatController::class, 'index'])->name('chat');
    Route::get('/chat/{group}', [GroupChatController::class, 'show'])->name('chat.show');
    Route::post('/chat/{group}/messages', [GroupChatController::class, 'store'])->name('chat.messages.store');
    Route::get('/chat/{group}/messages', [GroupChatController::class, 'getMessages'])->name('chat.messages.index');

    // Direct Messages
    Route::get('/messages', [DirectMessageController::class, 'index'])->name('direct-messages.index');
    Route::post('/messages', [DirectMessageController::class, 'store'])->name('direct-messages.store');
    Route::get('/messages/{message}', [DirectMessageController::class, 'show'])->name('direct-messages.show');
    Route::put('/messages/{message}', [DirectMessageController::class, 'update'])->name('direct-messages.update');
    Route::delete('/messages/{message}', [DirectMessageController::class, 'destroy'])->name('direct-messages.destroy');

    // Group Messages
    Route::prefix('web')->group(function() {
        // Group messages
        Route::get('/groups/{group}/messages', [App\Http\Controllers\GroupChatController::class, 'getMessagesAPI']);
        Route::post('/groups/{group}/messages', [App\Http\Controllers\GroupChatController::class, 'storeAPI']);
        
        // Direct messages
        Route::get('/direct-messages/{user}', [App\Http\Controllers\DirectMessageController::class, 'messages']);
        Route::post('/direct-messages/{user}', [App\Http\Controllers\DirectMessageController::class, 'store']);
    });
});

// Add API web fallback routes with explicit session auth
Route::prefix('api/web')->middleware(['web', 'auth'])->group(function() {
    // Direct message fallback routes with web middleware
    Route::get('/direct-messages/{user}', [App\Http\Controllers\API\DirectMessageController::class, 'messages']);
    Route::post('/direct-messages/{user}', [App\Http\Controllers\API\DirectMessageController::class, 'store']);
});

// Add broadcasting authentication route
Broadcast::routes(['middleware' => ['web', 'auth']]);

// Add AI test page (no auth required)
Route::get('/ai-test', function () {
    return Inertia::render('AITest');
})->name('ai.test');

// Add a route to test OpenRouter API directly
Route::get('/test-openrouter', function() {
    $apiKey = env('OPENROUTER_API_KEY', '');
    
    if (empty($apiKey)) {
        return 'OpenRouter API key not configured in .env file';
    }
    
    try {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://openrouter.ai/api/v1/chat/completions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
            'HTTP-Referer: ' . config('app.url', 'http://localhost'),
        ]);
        
        $data = [
            'model' => 'meta-llama/llama-4-scout:free',
            'messages' => [
                [
                    'role' => 'user',
                    'content' => 'Hello, this is a test message from the API. Please respond with a short greeting.'
                ]
            ],
            'max_tokens' => 50
        ];
        
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        
        $response = curl_exec($ch);
        $error = curl_error($ch);
        $info = curl_getinfo($ch);
        curl_close($ch);
        
        if ($error) {
            return "cURL Error: " . $error;
        }
        
        $decoded = json_decode($response, true);
        
        return [
            'status_code' => $info['http_code'],
            'response' => $decoded,
            'api_key_length' => strlen($apiKey),
            'api_key_prefix' => substr($apiKey, 0, 10) . '...',
        ];
    } catch (\Exception $e) {
        return [
            'error' => $e->getMessage(),
        ];
    }
});

// Add a debug route for logs (only for development)
Route::get('/debug-logs', function() {
    if (app()->environment('production')) {
        return 'Not available in production.';
    }
    
    $logFile = storage_path('logs/laravel.log');
    
    if (!file_exists($logFile)) {
        return 'Log file does not exist.';
    }
    
    // Get the last 50 lines
    $logs = [];
    $file = new \SplFileObject($logFile, 'r');
    $file->seek(PHP_INT_MAX);
    $totalLines = $file->key();
    
    $startLine = max(0, $totalLines - 50);
    $file->seek($startLine);
    
    while (!$file->eof()) {
        $logs[] = $file->current();
        $file->next();
    }
    
    return view('debug.logs', [
        'logs' => implode('', $logs)
    ]);
});

// Add a route to directly test the AI service
Route::get('/debug/ai-service-test', function () {
    $aiService = app(\App\Services\AIService::class);
    $result = $aiService->processTaskPrompt(
        "Create a web development project with 3 tasks including backend, frontend, and documentation", 
        1, // Default user ID
        1  // Default group ID
    );
    return response()->json($result);
});

// Add a route with a simple UI to test OpenRouter integration
Route::get('/ai-test-page', function () {
    return view('ai-test', [
        'title' => 'AI Integration Test',
        'apiKey' => substr(env('OPENROUTER_API_KEY', ''), 0, 10) . '...',
    ]);
});

// Add a debug route to check raw API response without parsing
Route::get('/debug/ai-raw-response', function () {
    $apiKey = env('OPENROUTER_API_KEY', '');
    $baseUrl = 'https://openrouter.ai/api/v1';
    $model = env('OPENROUTER_MODEL', 'meta-llama/llama-4-scout:free');
    
    $http = \Illuminate\Support\Facades\Http::withHeaders([
        'Authorization' => 'Bearer ' . $apiKey,
        'Content-Type' => 'application/json',
        'HTTP-Referer' => config('app.url', 'http://localhost'),
        'X-Title' => 'Workflow Task Manager'
    ])->withoutVerifying();
    
    $systemMessage = "Create a valid JSON structure for a website development project with the following tasks. Format your response EXACTLY as follows, with NO additional text:
    {
        \"assignment\": {
            \"title\": \"Website Development Project\",
            \"unit_name\": \"Web Development\",
            \"description\": \"A project to create a complete website\",
            \"due_date\": \"2025-06-15\"
        },
        \"tasks\": [
            {
                \"title\": \"Frontend Development\",
                \"description\": \"Create the website frontend using React\",
                \"assigned_to_name\": \"John\",
                \"start_date\": \"2025-05-22\",
                \"end_date\": \"2025-05-29\",
                \"priority\": \"high\"
            }
        ]
    }";
    
    // Make the API request
    $response = $http->post($baseUrl . '/chat/completions', [
        'model' => $model,
        'messages' => [
            ['role' => 'system', 'content' => $systemMessage],
            ['role' => 'user', 'content' => "Create a website development project with tasks for frontend, backend and documentation."],
        ],
        'temperature' => 0.1,
        'response_format' => ["type" => "json_object"],
    ]);
    
    return response()->json([
        'status' => $response->status(),
        'headers' => $response->headers(),
        'raw_response' => $response->body(),
        'parsed_attempt' => json_decode($response->json()['choices'][0]['message']['content'] ?? '{}', true),
        'parse_error' => json_last_error_msg(),
        'content_type' => $response->header('Content-Type'),
    ]);
});

// Add a test route with hardcoded JSON to test the database insertion
Route::get('/debug/test-hardcoded-json', function () {
    // Sample valid JSON that should work with our database schema
    $validJson = [
        'assignment' => [
            'title' => 'Test Assignment',
            'unit_name' => 'Test Unit',
            'description' => 'This is a test assignment created with hardcoded JSON',
            'due_date' => date('Y-m-d', strtotime('+2 weeks')),
            'start_date' => date('Y-m-d'),
            'end_date' => date('Y-m-d', strtotime('+2 weeks')),
            'priority' => 'medium'
        ],
        'tasks' => [
            [
                'title' => 'Task 1',
                'description' => 'This is task 1',
                'assigned_to_name' => 'User 1',
                'start_date' => date('Y-m-d'),
                'end_date' => date('Y-m-d', strtotime('+1 week')),
                'priority' => 'medium'
            ],
            [
                'title' => 'Task 2',
                'description' => 'This is task 2',
                'assigned_to_name' => 'User 2',
                'start_date' => date('Y-m-d', strtotime('+1 week')),
                'end_date' => date('Y-m-d', strtotime('+2 weeks')),
                'priority' => 'high'
            ]
        ]
    ];
    
    try {
        // Test database insertion with the sample JSON
        \Illuminate\Support\Facades\DB::beginTransaction();
        
        $userId = 1; // Default user
        $groupId = 1; // Default group
        
        // Create assignment
        $assignment = \App\Models\GroupAssignment::create([
            'group_id' => $groupId,
            'title' => $validJson['assignment']['title'],
            'unit_name' => $validJson['assignment']['unit_name'] ?? 'General',
            'description' => $validJson['assignment']['description'] ?? '',
            'start_date' => $validJson['assignment']['start_date'] ?? now(),
            'end_date' => $validJson['assignment']['end_date'] ?? now()->addWeeks(2),
            'due_date' => $validJson['assignment']['due_date'] ?? now()->addWeeks(2),
            'priority' => $validJson['assignment']['priority'] ?? 'medium',
            'status' => 'active',
            'created_by' => $userId,
        ]);
        
        // Create tasks
        $createdTasks = [];
        foreach ($validJson['tasks'] as $taskData) {
            $task = \App\Models\GroupTask::create([
                'assignment_id' => $assignment->id,
                'title' => $taskData['title'],
                'description' => $taskData['description'] ?? '',
                'assigned_to' => $userId, // Just use default user for simplicity
                'start_date' => $taskData['start_date'] ?? now(),
                'end_date' => $taskData['end_date'] ?? now()->addWeeks(1),
                'status' => 'pending',
                'priority' => $taskData['priority'] ?? 'medium',
                'created_by' => $userId,
                'order_index' => count($createdTasks),
            ]);
            
            $createdTasks[] = $task;
        }
        
        \Illuminate\Support\Facades\DB::commit();
        
        return response()->json([
            'success' => true,
            'message' => 'Successfully created test assignment and tasks',
            'assignment' => $assignment,
            'tasks' => $createdTasks
        ]);
        
    } catch (\Exception $e) {
        \Illuminate\Support\Facades\DB::rollBack();
        return response()->json([
            'success' => false,
            'error' => 'Error creating test assignment: ' . $e->getMessage(),
            'trace' => explode("\n", $e->getTraceAsString())
        ], 500);
    }
});

// Add a debug route for chat system
Route::get('/debug/chat', function() {
    return view('debug.chat', [
        'title' => 'Chat Debug',
        'config' => [
            'pusher_key' => config('broadcasting.connections.pusher.key'),
            'pusher_cluster' => config('broadcasting.connections.pusher.options.cluster'),
            'csrf_token' => csrf_token(),
            'user' => auth()->user() ? [
                'id' => auth()->id(),
                'name' => auth()->user()->name
            ] : null
        ]
    ]);
});

// Add a debug route to check users in the database
Route::get('/debug/users', function() {
    if (app()->environment('production')) {
        return 'Not available in production.';
    }
    
    try {
        $users = \App\Models\User::select('id', 'name', 'email')
            ->take(10)
            ->get();
        
        $count = \App\Models\User::count();
        
        return response()->json([
            'success' => true,
            'total_count' => $count,
            'users' => $users,
            'auth' => [
                'check' => auth()->check(),
                'id' => auth()->id(),
                'user' => auth()->user() ? auth()->user()->only(['id', 'name', 'email']) : null
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => explode("\n", $e->getTraceAsString())
        ], 500);
    }
});

// Add a debug route to test user search
Route::get('/debug/search-users', function(\Illuminate\Http\Request $request) {
    if (app()->environment('production')) {
        return 'Not available in production.';
    }
    
    try {
        $term = $request->input('q', '');
        
        $query = \App\Models\User::query();
        
        if (!empty($term)) {
            $query->where(function($q) use ($term) {
                $q->where('name', 'LIKE', "%{$term}%")
                  ->orWhere('email', 'LIKE', "%{$term}%");
            });
        }
        
        $users = $query->select('id', 'name', 'email', 'created_at')
            ->take(10)
            ->get();
        
        return response()->json([
            'success' => true,
            'term' => $term,
            'count' => $users->count(),
            'users' => $users,
            'sql' => [
                'query' => $query->toSql(),
                'bindings' => $query->getBindings()
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => explode("\n", $e->getTraceAsString())
        ], 500);
    }
});

// Add a debug route for authentication status
Route::get('/debug/auth-status', function (Request $request) {
    $user = $request->user();
    $sessionData = [];
    
    if ($request->hasSession()) {
        $sessionData = [
            'has_session' => true,
            'session_id' => $request->session()->getId(),
            'session_token' => csrf_token()
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
        'csrf' => [
            'token' => csrf_token(),
            'token_meta' => '<meta name="csrf-token" content="'.csrf_token().'">'
        ],
        'cookie_settings' => [
            'secure' => config('session.secure'),
            'same_site' => config('session.same_site'),
            'domain' => config('session.domain')
        ]
    ]);
});

// Add direct API endpoints accessible via web routes (with session authentication)
Route::middleware(['auth', 'verified'])->prefix('api')->group(function () {
    Route::get('/chat/groups', [App\Http\Controllers\API\ChatController::class, 'getGroups']);
    Route::get('/chat/search-users', [App\Http\Controllers\API\ChatController::class, 'searchUsers']);
    Route::get('/direct-messages', [App\Http\Controllers\API\ChatController::class, 'getDirectMessages']);
    Route::get('/test-auth', [App\Http\Controllers\API\ChatController::class, 'testAuth']);
    
    // Group Messages
    Route::prefix('web')->group(function() {
        Route::get('/groups/{group}/messages', [App\Http\Controllers\GroupChatController::class, 'getMessagesAPI']);
        Route::post('/groups/{group}/messages', [App\Http\Controllers\GroupChatController::class, 'storeAPI']);
    });
});

// Add a debug route for testing broadcasting auth
Route::get('/debug/broadcasting-auth', function() {
    $authEndpoint = url('/broadcasting/auth');
    $csrfToken = csrf_token();
    $userId = auth()->id() ?: 0;
    
    return view('debug.broadcasting', [
        'csrfToken' => $csrfToken,
        'authEndpoint' => $authEndpoint,
        'userId' => $userId,
        'isAuthenticated' => auth()->check(),
        'socketId' => request('socket_id', '123.456'),
    ]);
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
