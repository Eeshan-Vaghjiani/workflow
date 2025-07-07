<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\KanbanBoard;

class DebugController extends Controller
{
    /**
     * Display a basic auth test view.
     */
    public function authTest()
    {
        return view('debug.auth-test');
    }

    /**
     * Display a kanban auth test view.
     */
    public function kanbanTest()
    {
        return view('debug.kanban');
    }

    /**
     * Test kanban auth middleware directly.
     */
    public function testKanbanAuth(Request $request)
    {
        $user = Auth::user();

        // Detailed authentication checks
        $authInfo = [
            'authenticated' => Auth::check(),
            'user_id' => Auth::id(),
            'guards' => [
                'web' => Auth::guard('web')->check(),
                'api' => Auth::guard('api')->check(),
                'sanctum' => Auth::guard('sanctum')->check(),
            ],
            'request_user' => $request->user() ? true : false,
            'cookie_count' => count($request->cookies->all()),
            'has_session' => $request->hasSession(),
            'csrf_token' => csrf_token(),
            'headers' => [
                'accept' => $request->header('Accept'),
                'content_type' => $request->header('Content-Type'),
                'x_requested_with' => $request->header('X-Requested-With'),
                'user_agent' => $request->header('User-Agent'),
            ]
        ];

        // Log the authentication information
        Log::info('DebugController: Kanban Auth Test', $authInfo);

        // Try to fetch kanban boards directly
        $boards = [];
        $error = null;

        try {
            if (Auth::check()) {
                $boards = KanbanBoard::where('created_by', Auth::id())->get();
            }
        } catch (\Exception $e) {
            $error = [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ];
        }

        // Return all information
        return response()->json([
            'auth_info' => $authInfo,
            'boards' => $boards,
            'error' => $error,
            'message' => Auth::check() ? 'Authentication is working' : 'Not authenticated'
        ]);
    }

    /**
     * Test the Kanban API directly.
     */
    public function testKanbanAPI(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'authenticated' => false,
                    'message' => 'Not authenticated',
                    'error' => 'You must be logged in to access this endpoint',
                ], 401);
            }
            
            // Create a test board directly
            $board = new \App\Models\KanbanBoard([
                'name' => 'API Test Board ' . now()->format('Y-m-d H:i'),
                'description' => 'Created via debug API endpoint',
                'created_by' => $user->id,
                'is_active' => true,
                'settings' => ['test' => true],
            ]);
            $board->save();
            
            // Create columns
            $columns = [];
            $columnData = [
                ['name' => 'To Do', 'color' => '#3B82F6', 'position' => 1, 'is_default' => true],
                ['name' => 'In Progress', 'color' => '#F59E0B', 'position' => 2, 'is_default' => false],
                ['name' => 'Done', 'color' => '#10B981', 'position' => 3, 'is_default' => false],
            ];
            
            foreach ($columnData as $data) {
                $column = $board->columns()->create([
                    'name' => $data['name'],
                    'color' => $data['color'],
                    'position' => $data['position'],
                    'is_default' => $data['is_default'],
                    'settings' => [],
                ]);
                $columns[] = $column;
            }
            
            // Create a task
            $task = null;
            if (!empty($columns)) {
                $defaultColumn = $columns[0];
                $task = $defaultColumn->tasks()->create([
                    'title' => 'API Test Task',
                    'description' => 'Created via debug API endpoint',
                    'position' => 1,
                    'created_by' => $user->id,
                    'board_id' => $board->id,
                    'due_date' => now()->addDays(7),
                    'priority' => 'medium',
                    'status' => 'pending',
                ]);
            }
            
            // Return the created data
            return response()->json([
                'success' => true,
                'message' => 'Test Kanban board created successfully',
                'board' => $board,
                'columns' => $columns,
                'task' => $task,
                'url' => url("/kanban/{$board->id}"),
            ]);
        } catch (\Exception $e) {
            Log::error('Error in testKanbanAPI', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error creating test Kanban board',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    /**
     * Test Kanban board API with detailed error logging.
     */
    public function kanbanApiTest(Request $request)
    {
        try {
            // Check authentication status
            $user = Auth::user();
            $isAuthenticated = !is_null($user);
            
            // Log detailed request information
            Log::info('Kanban API Test Request', [
                'path' => $request->path(),
                'method' => $request->method(),
                'authenticated' => $isAuthenticated,
                'user_id' => $user ? $user->id : null,
                'session_id' => $request->hasSession() ? $request->session()->getId() : null,
                'cookies' => count($request->cookies->all()),
                'headers' => [
                    'accept' => $request->header('Accept'),
                    'content_type' => $request->header('Content-Type'),
                    'x_requested_with' => $request->header('X-Requested-With'),
                    'authorization' => $request->header('Authorization') ? 'Present' : 'Missing',
                ],
            ]);
            
            // If not authenticated, return error
            if (!$isAuthenticated) {
                return response()->json([
                    'authenticated' => false,
                    'message' => 'Not authenticated',
                    'error' => 'You must be logged in to access this endpoint',
                ], 401);
            }
            
            // Try to fetch Kanban boards directly from the model
            try {
                $boards = \App\Models\KanbanBoard::where('created_by', $user->id)
                    ->orWhere('is_public', true)
                    ->get();
                    
                Log::info('Kanban API Test: Boards fetched successfully', [
                    'count' => $boards->count(),
                    'user_id' => $user->id,
                ]);
                
                return response()->json([
                    'authenticated' => true,
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                    ],
                    'boards_count' => $boards->count(),
                    'boards' => $boards,
                    'message' => 'Boards fetched successfully',
                ]);
            } catch (\Exception $e) {
                Log::error('Kanban API Test: Error fetching boards', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                
                return response()->json([
                    'authenticated' => true,
                    'error' => 'Error fetching boards: ' . $e->getMessage(),
                    'user_id' => $user->id,
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Kanban API Test: Unexpected error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'authenticated' => false,
                'error' => 'Unexpected error: ' . $e->getMessage(),
            ], 500);
        }
    }
}
