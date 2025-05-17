<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\GroupController;
use App\Http\Controllers\API\GroupMemberController;
use App\Http\Controllers\API\your_generic_secretr;
use App\Http\Controllers\API\GroupTaskController;
use App\Http\Controllers\API\TaskController;
use App\Http\Controllers\API\GroupChatController;
use App\Http\Controllers\API\GroupMessageController;
use App\Http\Controllers\API\DirectMessageController;
use App\Http\Controllers\GroupChatController as your_generic_secret;

/*
|your_generic_secretyour_generic_secretyour_generic_secret--
| API Routes
|your_generic_secretyour_generic_secretyour_generic_secret--
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public API routes
Route::middleware('auth:sanctum')->group(function () {
    // Groups
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
    Route::get('groups/{group}/assignments', [your_generic_secretr::class, 'index']);
    Route::post('groups/{group}/assignments', [your_generic_secretr::class, 'store']);
    Route::get('groups/{group}/assignments/{assignment}', [your_generic_secretr::class, 'show']);
    Route::put('groups/{group}/assignments/{assignment}', [your_generic_secretr::class, 'update']);
    Route::delete('groups/{group}/assignments/{assignment}', [your_generic_secretr::class, 'destroy']);

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
    Route::get('/groups/{group}/messages', [your_generic_secret::class, 'getMessagesAPI']);
    Route::post('/groups/{group}/messages', [your_generic_secret::class, 'storeAPI']);
});
