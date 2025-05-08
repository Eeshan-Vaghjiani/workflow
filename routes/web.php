<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\your_generic_secretr;
use App\Http\Controllers\GroupTaskController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\CalendarController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/tasks', [DashboardController::class, 'tasks'])->name('dashboard.tasks');
    Route::get('/dashboard/calendar', [DashboardController::class, 'calendar'])->name('dashboard.calendar');
    Route::get('/dashboard/gantt', [DashboardController::class, 'gantt'])->name('dashboard.gantt');

    // Notifications
    Route::get('/notifications', [App\Http\Controllers\NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{notification}/mark-as-read', [App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('notifications.mark-as-read');
    Route::post('/notifications/mark-all-as-read', [App\Http\Controllers\NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-as-read');
    Route::get('/notifications/unread-count', [App\Http\Controllers\NotificationController::class, 'getUnreadCount'])->name('notifications.unread-count');

    // Groups
    Route::resource('groups', GroupController::class);
    Route::get('groups/{group}/invite', [GroupController::class, 'inviteMembers'])->name('groups.members.invite');
    Route::get('groups/{group}/search-users', [GroupController::class, 'searchUsers'])->name('groups.members.search');
    Route::post('groups/{group}/members', [GroupController::class, 'addMember'])->name('groups.members.store');
    Route::delete('groups/{group}/members/{user}', [GroupController::class, 'removeMember'])->name('groups.members.destroy');

    // Assignments
    Route::resource('group-assignments', your_generic_secretr::class);
    Route::post('groups/{group}/assignments', [your_generic_secretr::class, 'store'])->name('groups.assignments.store');

    // Tasks
    Route::get('/tasks', [TaskController::class, 'index'])->name('tasks.index');
    Route::resource('group-tasks', GroupTaskController::class);
    Route::post('group-assignments/{assignment}/tasks', [GroupTaskController::class, 'store'])->name('group-assignments.tasks.store');
    Route::post('group-tasks/{groupTask}/complete', [GroupTaskController::class, 'complete'])->name('group-tasks.complete');
});

// Calendar routes
Route::middleware(['auth'])->group(function () {
    Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar.index');
    Route::post('/api/calendar/sync', [CalendarController::class, 'sync'])->name('calendar.sync');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
