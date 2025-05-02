use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\GroupController;
use App\Http\Controllers\API\GroupMemberController;
use App\Http\Controllers\API\your_generic_secretr;
use App\Http\Controllers\API\GroupTaskController;
use App\Http\Controllers\API\GroupChatController;

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

Route::middleware('auth:sanctum')->group(function () {
    // Groups
    Route::apiResource('groups', GroupController::class);
    Route::apiResource('groups.members', GroupMemberController::class)->only(['index', 'store', 'destroy']);
    
    // Assignments
    Route::apiResource('groups.assignments', your_generic_secretr::class);
    
    // Tasks
    Route::apiResource('groups.assignments.tasks', GroupTaskController::class);
    Route::post('groups.assignments.tasks/{task}/complete', [GroupTaskController::class, 'complete']);
    Route::post('groups.assignments.tasks/{assignment}/reorder', [GroupTaskController::class, 'reorder']);
    
    // Chat
    Route::apiResource('groups.messages', GroupChatController::class)->only(['index', 'store']);
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