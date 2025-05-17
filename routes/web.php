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
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Broadcast;

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
    Route::get('/group-assignments', function() { return redirect()->route('group-assignments.index', ['group' => 1]); });
    Route::get('/assignments', function() { return redirect()->route('group-assignments.index', ['group' => 1]); });
    Route::get('/tasks', [DashboardController::class, 'tasks'])->name('group-tasks.index');
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/mark-as-read', [NotificationController::class, 'markAsRead'])->name('notifications.mark-as-read');
    Route::post('/notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-as-read');

    // Groups
    Route::get('/groups', [GroupController::class, 'index'])->name('groups.index');
    Route::get('/groups/create', [GroupController::class, 'create'])->name('groups.create');
    Route::post('/groups', [GroupController::class, 'store'])->name('groups.store');
    Route::get('/groups/{group}', [GroupController::class, 'show'])->name('groups.show');
    Route::get('/groups/{group}/edit', [GroupController::class, 'edit'])->name('groups.edit');
    Route::put('/groups/{group}', [GroupController::class, 'update'])->name('groups.update');
    Route::delete('/groups/{group}', [GroupController::class, 'destroy'])->name('groups.destroy');

    // Group Members
    Route::get('/groups/{group}/members', [GroupMemberController::class, 'index'])->name('groups.members.index');
    Route::get('/groups/{group}/members/invite', [GroupMemberController::class, 'invite'])->name('groups.members.invite');
    Route::post('/groups/{group}/members', [GroupMemberController::class, 'store'])->name('groups.members.store');
    Route::delete('/groups/{group}/members/{member}', [GroupMemberController::class, 'destroy'])->name('groups.members.destroy');

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

    // Direct Messages
    Route::get('/messages', [DirectMessageController::class, 'index'])->name('direct-messages.index');
    Route::post('/messages', [DirectMessageController::class, 'store'])->name('direct-messages.store');
    Route::get('/messages/{message}', [DirectMessageController::class, 'show'])->name('direct-messages.show');
    Route::put('/messages/{message}', [DirectMessageController::class, 'update'])->name('direct-messages.update');
    Route::delete('/messages/{message}', [DirectMessageController::class, 'destroy'])->name('direct-messages.destroy');

    // Chat Routes
    Route::get('/chat', [GroupChatController::class, 'index'])->name('chat');
    Route::get('/chat/{group}', [GroupChatController::class, 'show'])->name('chat.show');
    Route::post('/chat/{group}/messages', [GroupChatController::class, 'store'])->name('chat.messages.store');
    Route::get('/chat/{group}/messages', [GroupChatController::class, 'getMessages'])->name('chat.messages.index');
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

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
