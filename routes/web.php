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
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Laravel\WorkOS\Http\Middleware\ValidateSessionWithWorkOS;
use App\Http\Middleware\TwoFactorAuthenticationMiddleware;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\Settings\ProfileController as SettingsProfileController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\TwoFactorAuthController;
use App\Http\Controllers\PusherTestController;

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

Route::get('/csrf-refresh', function() {
    return response()->json(['csrf_token' => csrf_token()]);
});

Route::get('/', function () {
    return Inertia::render('home');
})->name('home');

// Make sure this is outside the auth middleware group, before it
Route::post('/mpesa/callback', [App\Http\Controllers\MpesaController::class, 'callback'])->name('mpesa.callback');

// Add API version of the callback route
Route::post('/api/mpesa/callback', [App\Http\Controllers\MpesaController::class, 'callback'])->name('mpesa.api.callback');

// Add direct access to mpesa API route (no auth required)
Route::get('/api/mpesa-public', [App\Http\Controllers\MpesaController::class, 'index'])->name('api.mpesa.public');

// Add a direct route to the dashboard for WorkOS authentication callback
Route::get('/auth-success', function () {
    return redirect()->route('dashboard');
})->name('auth.success');

// Add authentication debugger page
Route::get('/auth-debug', function () {
    return Inertia::render('AuthDebug');
})->name('auth.debug');

Route::middleware([
    'auth',
    'verified',
    ValidateSessionWithWorkOS::class,
    'two_factor'
])->group(function () {
    // Mpesa Payment Routes
    Route::get('/mpesa', function(Request $request) {
        return Inertia::render('MpesaPayment');
    })->name('mpesa.index');

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/calendar', [DashboardController::class, 'calendar'])->name('dashboard.calendar');
    Route::get('/dashboard/gantt', [DashboardController::class, 'gantt'])->name('dashboard.gantt');

    // Simple redirects for Dashboard links
    Route::get('/calendar', function() { return redirect('/dashboard/calendar'); });

    // Dynamic group assignments redirect - uses first group the user is a member of
    Route::get('/group-assignments', function() {
        // Get the first group the user is a member of, or redirect to groups list if none
        $user = Auth::user();
        $group = $user->groups()->first();

        if ($group) {
            return redirect()->route('group-assignments.index', ['group' => $group->id]);
        } else {
            return redirect()->route('groups.index')->with('error', 'You need to join a group first.');
        }
    });

    // Dynamic assignments redirect - uses first group the user is a member of
    Route::get('/assignments', [GroupAssignmentController::class, 'index'])->name('assignments');
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

    // AI Task Assignment
    Route::get('/groups/{group}/ai-tasks', [App\Http\Controllers\API\AITaskController::class, 'index'])->name('ai-tasks.index');
    Route::get('/groups/{group}/assignments/{assignment}/ai-tasks', [App\Http\Controllers\API\AITaskController::class, 'forAssignment'])->name('ai-tasks.for-assignment');

    // AI Tasks Dashboard - shows all AI generated tasks across groups
    Route::get('/ai-tasks/dashboard', [App\Http\Controllers\API\AITaskController::class, 'dashboard'])->name('ai-tasks.dashboard');

    // AI Assignment Edit
    Route::get('/groups/{group}/assignments/{assignment}/ai-edit', [App\Http\Controllers\API\AITaskController::class, 'editAssignment'])->name('ai-tasks.edit');
    Route::post('/groups/{group}/assignments/{assignment}/ai-update', [App\Http\Controllers\API\AITaskController::class, 'updateAssignment'])->name('ai-tasks.update');

    // AI Task API endpoints with web middleware to ensure proper session handling
    Route::post('/groups/{group}/ai-tasks/generate', [App\Http\Controllers\API\AITaskController::class, 'generateTasks'])->name('ai-tasks.generate');
    Route::post('/groups/{group}/ai-tasks/distribute', [App\Http\Controllers\API\AITaskController::class, 'autoDistributeTasks'])->name('ai-tasks.distribute');
    Route::post('/groups/{group}/assignments/ai-create', [App\Http\Controllers\API\AITaskController::class, 'createAssignment'])->name('ai-tasks.create-assignment');
    Route::post('/groups/{group}/assignments/{assignment}/tasks/ai-create', [App\Http\Controllers\API\AITaskController::class, 'addTasksToAssignment'])->name('ai-tasks.add-tasks');

    // Group Tasks
    Route::get('/tasks', [GroupTaskController::class, 'index'])->name('group-tasks.index');
    Route::get('/tasks/kanban', [GroupTaskController::class, 'kanbanView'])->name('group-tasks.kanban');
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
        Route::get('/direct-messages/{user}', [App\Http\Controllers\API\DirectMessageController::class, 'messages']);
        Route::post('/direct-messages/{user}', [App\Http\Controllers\API\DirectMessageController::class, 'store']);
        Route::delete('/direct-messages/{message}', [App\Http\Controllers\API\DirectMessageController::class, 'destroy']);
    });

    // Calendar, Pomodoro, and Study Planner
    Route::get('/study-planner', [\App\Http\Controllers\StudyPlannerController::class, 'index'])->name('study-planner.index');
    Route::get('/pomodoro', [\App\Http\Controllers\PomodoroController::class, 'index'])->name('pomodoro.index');
    Route::get('/ai-tasks', [\App\Http\Controllers\API\AITaskController::class, 'dashboard'])->name('ai-tasks.dashboard');

    // Pomodoro routes with web middleware
    Route::post('/pomodoro/sessions', [App\Http\Controllers\PomodoroController::class, 'recordSession']);
    Route::get('/pomodoro/stats', [App\Http\Controllers\PomodoroController::class, 'getStats']);
    Route::get('/pomodoro/settings/{userId?}', [App\Http\Controllers\PomodoroController::class, 'getUserSettings']);

    // Google Calendar OAuth routes
    Route::get('/google/auth', [App\Http\Controllers\GoogleAuthController::class, 'redirectToGoogle'])->name('google.auth');
    Route::get('/google/callback', [App\Http\Controllers\GoogleAuthController::class, 'handleGoogleCallback'])->name('google.callback');
    Route::get('/google/disconnect', [App\Http\Controllers\GoogleAuthController::class, 'disconnect'])->name('google.disconnect');
    Route::get('/calendar/settings', [App\Http\Controllers\GoogleAuthController::class, 'settings'])->name('calendar.settings');
    Route::post('/calendar/settings', [App\Http\Controllers\GoogleAuthController::class, 'saveSettings'])->name('calendar.save-settings');

    // Calendar sync route (web version)
    Route::post('/calendar/sync', [App\Http\Controllers\CalendarController::class, 'sync'])->name('calendar.sync');

    // Task update routes for calendar integration
    Route::put('/tasks/{id}', [App\Http\Controllers\API\TaskController::class, 'updateDates'])->name('tasks.update-dates');
});

// Add API web fallback routes with explicit session auth
Route::prefix('api/web')->middleware(['web', 'auth'])->group(function() {
    // Direct message fallback routes with web middleware
    Route::get('/direct-messages/{user}', [App\Http\Controllers\API\DirectMessageController::class, 'messages']);
    Route::post('/direct-messages/{user}', [App\Http\Controllers\API\DirectMessageController::class, 'store']);

    // Study Planner routes with web middleware
    Route::get('/study-sessions', [App\Http\Controllers\StudyPlannerController::class, 'getSessions']);
    Route::get('/study-tasks', [App\Http\Controllers\StudyPlannerController::class, 'getTasks']);
    Route::post('/study-sessions', [App\Http\Controllers\StudyPlannerController::class, 'storeSession']);
    Route::put('/study-sessions/{session}', [App\Http\Controllers\StudyPlannerController::class, 'updateSession']);
    Route::delete('/study-sessions/{session}', [App\Http\Controllers\StudyPlannerController::class, 'deleteSession']);
    Route::post('/study-tasks', [App\Http\Controllers\StudyPlannerController::class, 'storeTask']);
    Route::put('/study-tasks/{task}', [App\Http\Controllers\StudyPlannerController::class, 'updateTask']);
    Route::delete('/study-tasks/{task}', [App\Http\Controllers\StudyPlannerController::class, 'deleteTask']);

    // Pomodoro routes with web middleware - matching the expected client endpoint
    Route::post('/pomodoro/settings', [\App\Http\Controllers\PomodoroController::class, 'updateSettings']);
    Route::post('/pomodoro/sessions', [\App\Http\Controllers\PomodoroController::class, 'recordSession']);
    Route::get('/pomodoro/stats', [\App\Http\Controllers\PomodoroController::class, 'getStats']);
    Route::get('/pomodoro/settings/{userId?}', [\App\Http\Controllers\PomodoroController::class, 'getUserSettings']);
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
    $logs = [];
    try {
        $logFile = storage_path('logs/laravel.log');
        if (file_exists($logFile)) {
            $logs = array_slice(file($logFile), -100);
        }
    } catch (\Exception $e) {
        $logs = ['Error reading logs: ' . $e->getMessage()];
    }

    return response()->json([
        'logs' => $logs
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
Route::get('/debug/auth-status', function () {
    return response()->json([
        'authenticated' => Auth::check(),
        'user' => Auth::check() ? Auth::user() : null,
        'session' => Session::all(),
        'csrf' => [
            'token' => csrf_token(),
        ],
        'cookie_settings' => [
            'path' => config('session.path'),
            'domain' => config('session.domain'),
            'secure' => config('session.secure'),
            'same_site' => config('session.same_site'),
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

Route::get('/groups/{group}/assignments/{assignment}/task-assignments', [App\Http\Controllers\TaskAssignmentController::class, 'show'])
    ->name('task-assignments.show');

Route::get('group-tasks/{task}/edit', [App\Http\Controllers\GroupTaskController::class, 'edit'])
    ->name('group-tasks.edit-simple');

Route::put('group-tasks/{task}', [App\Http\Controllers\GroupTaskController::class, 'updateSimple'])
    ->name('group-tasks.update-simple');

// Add authentication status check route
Route::get('/auth/status', function () {
    return response()->json([
        'authenticated' => Auth::check(),
        'user' => Auth::user(),
        'csrf_token' => csrf_token(),
        'session_id' => Session::getId(),
        'cookies' => request()->cookies->all(),
    ]);
})->middleware(['web']);

// Add route to refresh CSRF token and session
Route::get('/auth/refresh-session', function () {
    // This will refresh the session and CSRF token
    Session::regenerate();
    return response()->json([
        'success' => true,
        'csrf_token' => csrf_token(),
        'session_id' => Session::getId(),
        'message' => 'Session refreshed successfully'
    ]);
})->middleware(['web']);

// Add direct task assignment routes for better authentication
Route::middleware(['auth', 'verified'])->group(function () {
    // Direct task assignment access via web routes
    Route::get('/groups/{groupId}/assignments/{assignmentId}/get-stats', function ($groupId, $assignmentId) {
        try {
            // Get the controller instance
            $controller = app()->make(App\Http\Controllers\API\TaskAssignmentController::class);

            // Call the controller method directly
            return $controller->getAssignmentStats(request(), $groupId, $assignmentId);
        } catch (\Exception $e) {
            // Log the error with more details
            \Illuminate\Support\Facades\Log::error('Error in task stats route', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'group_id' => $groupId,
                'assignment_id' => $assignmentId,
                'user_id' => auth()->id(),
                'auth_check' => auth()->check(),
                'session_id' => session()->getId(),
                'request_headers' => request()->headers->all()
            ]);

            // Return error response with more details
            return response()->json([
                'success' => false,
                'error' => 'Failed to get assignment stats: ' . $e->getMessage(),
                'error_details' => [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => explode("\n", $e->getTraceAsString())
                ],
                'auth_status' => [
                    'user_id' => auth()->id(),
                    'authenticated' => auth()->check(),
                    'user_name' => auth()->user() ? auth()->user()->name : null,
                    'session_id' => session()->getId()
                ],
                'request_info' => [
                    'group_id' => $groupId,
                    'assignment_id' => $assignmentId,
                    'headers' => request()->headers->all()
                ]
            ], 500);
        }
    })->name('task-assignments.get-stats');

    Route::post('/groups/{groupId}/assignments/{assignmentId}/distribute-tasks', [App\Http\Controllers\API\TaskAssignmentController::class, 'autoDistributeTasks'])
        ->name('task-assignments.distribute');
});

// Add direct web routes for the Study Planner and Pomodoro with explicit web middleware
Route::middleware(['auth'])->group(function () {
    Route::get('/study-planner', [App\Http\Controllers\StudyPlannerController::class, 'index'])->name('study-planner.index');
    Route::get('/pomodoro', [App\Http\Controllers\PomodoroController::class, 'index'])->name('pomodoro.index');
    Route::get('/ai-tasks', [App\Http\Controllers\API\AITaskController::class, 'dashboard'])->name('ai-tasks.dashboard');

    // Direct Study Planner web routes to ensure proper session handling
    Route::get('/study-sessions', [App\Http\Controllers\StudyPlannerController::class, 'getSessions'])->name('study-sessions.index');
    Route::get('/study-tasks', [App\Http\Controllers\StudyPlannerController::class, 'getTasks'])->name('study-tasks.index');
    Route::post('/study-sessions', [App\Http\Controllers\StudyPlannerController::class, 'storeSession'])->name('study-sessions.store');
    Route::put('/study-sessions/{session}', [App\Http\Controllers\StudyPlannerController::class, 'updateSession'])->name('study-sessions.update');
    Route::delete('/study-sessions/{session}', [App\Http\Controllers\StudyPlannerController::class, 'deleteSession'])->name('study-sessions.destroy');
    Route::post('/study-tasks', [App\Http\Controllers\StudyPlannerController::class, 'storeTask'])->name('study-tasks.store');
    Route::put('/study-tasks/{task}', [App\Http\Controllers\StudyPlannerController::class, 'updateTask'])->name('study-tasks.update');
    Route::delete('/study-tasks/{task}', [App\Http\Controllers\StudyPlannerController::class, 'deleteTask'])->name('study-tasks.destroy');

    // Direct Pomodoro access through web routes
    Route::post('/pomodoro/settings', [App\Http\Controllers\PomodoroController::class, 'updateSettings'])->name('pomodoro.settings.update');
    Route::post('/pomodoro/sessions', [App\Http\Controllers\PomodoroController::class, 'recordSession'])->name('pomodoro.sessions.store');
    Route::get('/pomodoro/stats', [App\Http\Controllers\PomodoroController::class, 'getStats'])->name('pomodoro.stats');
    Route::get('/pomodoro/settings/{userId?}', [App\Http\Controllers\PomodoroController::class, 'getUserSettings'])->name('pomodoro.settings.show');

    // Add the calendar sync route here
    Route::post('/calendar/sync', [App\Http\Controllers\CalendarController::class, 'sync'])->name('calendar.sync');

    // Task update routes for calendar integration
    Route::put('/tasks/{id}', [App\Http\Controllers\API\TaskController::class, 'updateDates'])->name('tasks.update-dates');
});

// Add a test route to check authentication status
Route::get('/auth-test', function () {
    return [
        'authenticated' => auth()->check(),
        'user' => auth()->user(),
        'session_id' => session()->getId(),
        'session_data' => [
            'two_factor_authenticated' => session('two_factor_authenticated'),
        ],
    ];
})->name('auth.test');

// Add a test route to disable 2FA
Route::get('/disable-2fa', function () {
    $user = auth()->user();

    if (!$user) {
        return ['error' => 'Not authenticated'];
    }

    if (!$user->hasTwoFactorEnabled()) {
        return ['status' => '2FA is already disabled'];
    }

    // Disable 2FA
    $user->forceFill([
        'two_factor_secret' => null,
        'two_factor_recovery_codes' => null,
        'two_factor_confirmed_at' => null,
    ])->save();

    // Mark the session as 2FA authenticated to avoid redirects
    session(['two_factor_authenticated' => true]);

    return [
        'status' => '2FA has been disabled',
        'user' => $user->only(['id', 'email', 'two_factor_confirmed_at']),
    ];
})->middleware(['auth'])->name('test.disable-2fa');

// Add a direct WorkOS callback route that bypasses CSRF protection
Route::get('/workos-callback', function (\Illuminate\Http\Request $request) {
    // Log the callback request
    \Illuminate\Support\Facades\Log::info('WorkOS callback received', [
        'code' => $request->code,
        'session_id' => session()->getId(),
    ]);

    if (!$request->has('code')) {
        return redirect()->route('login');
    }

    try {
        // Get the WorkOS instance directly
        $workos = new \Laravel\WorkOS\WorkOS(
            apiKey: config('workos.api_key'),
            clientId: config('workos.client_id')
        );

        // Get the user profile from the code
        $authResponse = $workos->userManagement()->authenticateWithCode($request->code);
        $profile = $authResponse->user;

        // Find or create the user
        $user = \App\Models\User::where('workos_id', $profile->id)->first();

        if (!$user) {
            // Check if user exists with this email
            $user = \App\Models\User::where('email', $profile->email)->first();

            if ($user) {
                // Update existing user
                $user->update([
                    'workos_id' => $profile->id,
                    'avatar' => $profile->avatar ?? $user->avatar,
                    'last_login_at' => now(),
                ]);
            } else {
                // Create new user
                $user = \App\Models\User::create([
                    'name' => $profile->firstName . ' ' . $profile->lastName,
                    'email' => $profile->email,
                    'email_verified_at' => now(),
                    'workos_id' => $profile->id,
                    'avatar' => $profile->avatar ?? '',
                    'password' => bcrypt(\Illuminate\Support\Str::random(32)),
                ]);

                // Mark new users as 2FA authenticated
                session(['two_factor_authenticated' => true]);
            }
        } else {
            // Update last login time
            $user->update(['last_login_at' => now()]);
        }

        // Login the user
        auth()->login($user);

        // Store access token in session
        session(['workos_access_token' => $authResponse->accessToken]);

                        // Redirect based on user role
        $isAdmin = (bool)$user->is_admin;

        \Illuminate\Support\Facades\Log::info('WorkOS login - checking admin status', [
            'user_id' => $user->id,
            'email' => $user->email,
            'is_admin_raw' => $user->is_admin,
            'is_admin_cast' => $isAdmin,
        ]);

        if ($isAdmin) {
            \Illuminate\Support\Facades\Log::info('WorkOS login - redirecting to admin dashboard');
            return redirect()->route('admin.dashboard');
        }

        // Redirect to regular dashboard
        \Illuminate\Support\Facades\Log::info('WorkOS login - redirecting to regular dashboard');
        return redirect()->route('dashboard');
    } catch (\Exception $e) {
        \Illuminate\Support\Facades\Log::error('WorkOS authentication error', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);

        return redirect()->route('login')->with('error', 'Authentication failed. Please try again.');
    }
})->middleware(['web'])->name('workos.callback');

// Direct route to disable 2FA without password verification
Route::get('/disable-2fa-direct', function () {
    $user = auth()->user();

    if (!$user) {
        return redirect()->route('login')->with('error', 'You must be logged in to disable 2FA.');
    }

    // Log the action
    \Illuminate\Support\Facades\Log::info('Directly disabling 2FA for user', [
        'user_id' => $user->id,
        'email' => $user->email,
    ]);

    // Disable 2FA by clearing the relevant fields
    $user->forceFill([
        'two_factor_secret' => null,
        'two_factor_recovery_codes' => null,
        'two_factor_confirmed_at' => null,
    ])->save();

    // Mark the session as 2FA authenticated to avoid redirects
    session(['two_factor_authenticated' => true]);

    // Return success message
    return redirect()->route('settings.two-factor-auth')
        ->with('status', '2FA has been disabled successfully.');
})->middleware(['auth'])->name('disable-2fa-direct');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

Route::get('/phpinfo', function () {
    phpinfo();
});

// Chat routes
Route::middleware(['auth'])->group(function () {
    // Direct messages
    Route::get('/web/direct-messages/{userId}', [ChatController::class, 'getDirectMessages']);
    Route::post('/web/direct-messages/{userId}', [ChatController::class, 'sendDirectMessage']);
    Route::delete('/messages/{id}', [ChatController::class, 'deleteMessage']);

    // Group messages
    Route::get('/chat/groups/{groupId}', [ChatController::class, 'getGroupMessages']);
    Route::post('/chat/groups/{groupId}/messages', [ChatController::class, 'sendGroupMessage']);
    Route::delete('/chat/groups/messages/{id}', [ChatController::class, 'deleteGroupMessage']);

    // Typing indicator
    Route::post('/chat/typing', [ChatController::class, 'typing']);
});

// Debug routes
Route::get('/debug/broadcasting', function () {
    return view('debug.broadcasting');
});
Route::get('/debug/chat', function () {
    return view('debug.chat');
});
Route::get('/debug/logs', function () {
    return view('debug.logs');
});
Route::get('/debug/pusher-test', [App\Http\Controllers\PusherTestController::class, 'showTestPage']);
Route::get('/debug/echo-debug', function () {
    return view('debug.echo-debug');
});
Route::get('/debug/pusher-broadcast', [App\Http\Controllers\PusherTestController::class, 'testBroadcast']);
Route::post('/debug/pusher-broadcast', [App\Http\Controllers\PusherTestController::class, 'testBroadcast']);
Route::get('/debug/auth-status', function () {
    return response()->json([
        'authenticated' => Auth::check(),
        'user' => Auth::check() ? Auth::user() : null,
        'session' => Session::all(),
        'csrf' => [
            'token' => csrf_token(),
        ],
        'cookie_settings' => [
            'path' => config('session.path'),
            'domain' => config('session.domain'),
            'secure' => config('session.secure'),
            'same_site' => config('session.same_site'),
        ]
    ]);
});

// Test route to manually broadcast an event
Route::get('/debug/broadcast-test', function() {
    $data = [
        'message' => 'Test message at ' . now(),
        'user' => [
            'id' => 1,
            'name' => 'Test User'
        ]
    ];

    event(new \App\Events\NewDirectMessage(
        new \App\Models\DirectMessage([
            'id' => 999,
            'sender_id' => 1,
            'receiver_id' => 1,
            'message' => 'Test message'
        ]),
        $data
    ));

    return response()->json(['success' => true, 'message' => 'Test event broadcasted', 'time' => now()]);
});

// Debug routes
Route::get('/debug/echo', [PusherTestController::class, 'echoDebug'])->name('debug.echo');
Route::get('/debug/pusher', [PusherTestController::class, 'index'])->name('debug.pusher');
Route::get('/debug/auth-status', [PusherTestController::class, 'authStatus'])->name('debug.auth-status');

// Test message routes
Route::get('/debug/send-test-message', [PusherTestController::class, 'sendTestMessage'])->name('debug.test-message');
Route::get('/debug/send-test-group-message', [PusherTestController::class, 'sendTestGroupMessage'])->name('debug.test-group-message');
Route::get('/debug/api-routes', function() {
    return response()->json([
        'direct_message_routes' => [
            'get_conversations' => '/api/direct-messages',
            'get_messages' => '/api/direct-messages/{userId}',
            'send_message' => '/api/direct-messages/{userId}',
            'web_send_message' => '/web/direct-messages/{userId}',
        ],
        'group_message_routes' => [
            'get_groups' => '/api/chat/groups',
            'get_messages' => '/api/chat/groups/{groupId}/messages',
            'send_message' => '/api/chat/groups/{groupId}/messages',
            'web_send_message' => '/web/groups/{groupId}/messages',
        ]
    ]);
});

// Debug route to check admin status
Route::get('/debug/admin-check', function() {
    $user = auth()->user();
    if (!$user) {
        return response()->json(['error' => 'Not logged in'], 401);
    }

    return response()->json([
        'user_id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'is_admin_raw' => $user->is_admin,
        'is_admin_method' => $user->isAdmin(),
        'admin_route' => route('admin.dashboard'),
    ]);
});

// Admin Routes
Route::middleware('web')->group(function () {
    Route::middleware(['auth', 'verified', ValidateSessionWithWorkOS::class, 'two_factor', 'admin'])
        ->prefix('admin')
        ->name('admin.')
        ->group(function () {
            Route::get('/', function () {
                return Inertia::render('admin/Dashboard');
            })->name('dashboard');

            Route::get('/users', function () {
                return Inertia::render('admin/users/Index');
            })->name('users.index');

            Route::get('/analytics', function () {
                return Inertia::render('admin/analytics/Index');
            })->name('analytics.index');

            Route::get('/audit', function () {
                return Inertia::render('admin/audit/Index');
            })->name('audit.index');
        });
});
