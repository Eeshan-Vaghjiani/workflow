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
    Route::get('/tasks/create', [GroupTaskController::class, 'create'])->name('group-tasks.create');
    Route::get('/tasks/{task}/edit', [GroupTaskController::class, 'edit'])->name('group-tasks.edit-simple');
    Route::put('/tasks/{task}', [GroupTaskController::class, 'update'])->name('group-tasks.update-simple');
    Route::post('/tasks/{task}/complete', [GroupTaskController::class, 'complete'])->name('group-tasks.complete-simple');
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

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
