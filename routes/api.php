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

Route::middleware('auth:sanctum')->group(function () {
    // Groups
    Route::apiResource('groups', GroupController::class);
    Route::apiResource('groups.members', GroupMemberController::class)->only(['index', 'store', 'destroy']);
    
    // Assignments
    Route::apiResource('groups.assignments', GroupAssignmentController::class);
    
    // Tasks
    Route::apiResource('groups.assignments.tasks', GroupTaskController::class);
    Route::post('groups.assignments.tasks/{task}/complete', [GroupTaskController::class, 'complete']);
    Route::post('groups.assignments.tasks/{assignment}/reorder', [GroupTaskController::class, 'reorder']);
    Route::post('/group/tasks', [GroupTaskController::class, 'store'])->name('group.tasks.store');
    
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
    })->name('dashboard');
}); 