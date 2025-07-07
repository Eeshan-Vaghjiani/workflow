<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\KanbanBoardResource;
use App\Models\KanbanBoard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class KanbanBoardController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        try {
            // Use middleware only if not from a direct route (direct routes add their own middleware)
            if (!request()->is('api/direct/*') && !request()->is('api/web/*')) {
                // Use the fully qualified middleware class name instead of alias
                $this->middleware(\App\Http\Middleware\KanbanAuthMiddleware::class);
            }

            // Log middleware configuration
            \Illuminate\Support\Facades\Log::info('KanbanBoardController: constructor', [
                'path' => request()->path(),
                'is_direct' => request()->is('api/direct/*'),
                'is_web' => request()->is('api/web/*'),
                'middleware_applied' => !request()->is('api/direct/*') && !request()->is('api/web/*')
            ]);
        } catch (\Exception $e) {
            // Log any errors during middleware registration
            \Illuminate\Support\Facades\Log::error('KanbanBoardController: constructor error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
        }
    }

    /**
     * Display a listing of the boards.
     */
    public function index(): JsonResponse|AnonymousResourceCollection
    {
        try {
            // Check if user is authenticated
            if (!Auth::check() && !request()->user()) {
                \Illuminate\Support\Facades\Log::error('KanbanBoardController: User not authenticated');
                return response()->json([
                    'message' => 'Unauthenticated. Please log in again.',
                    'error' => 'No authenticated user found',
                    'debug' => [
                        'auth_check' => Auth::check(),
                        'request_user' => request()->user() ? true : false,
                        'session' => request()->hasSession() ? ['id' => request()->session()->getId()] : null
                    ]
                ], 401);
            }

            // Get the authenticated user
            $user = Auth::user() ?? request()->user();
            
            if (!$user) {
                \Illuminate\Support\Facades\Log::error('KanbanBoardController: User not found');
                return response()->json([
                    'message' => 'User not found. Please log in again.',
                    'error' => 'No user object found despite authentication check passing',
                ], 401);
            }

            // Log the authentication status
            \Illuminate\Support\Facades\Log::info('KanbanBoardController: index method called', [
                'authenticated' => Auth::check(),
                'user_id' => $user->id,
                'user_name' => $user->name,
                'guards' => [
                    'web' => Auth::guard('web')->check(),
                    'api' => Auth::guard('api')->check(),
                    'sanctum' => Auth::guard('sanctum')->check(),
                ]
            ]);

            // Scope boards to the authenticated user
            $boards = KanbanBoard::where('created_by', $user->id)
                ->with(['creator'])
                ->get();

            \Illuminate\Support\Facades\Log::info('KanbanBoardController: returning boards', [
                'count' => $boards->count(),
                'board_ids' => $boards->pluck('id')->toArray(),
            ]);

            return KanbanBoardResource::collection($boards);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error in KanbanBoardController::index', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'auth' => [
                    'check' => Auth::check(),
                    'id' => Auth::id(),
                ]
            ]);
            
            return response()->json([
                'message' => 'Failed to retrieve kanban boards.',
                'error' => $e->getMessage(),
                'debug_info' => [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]
            ], 500);
        }
    }

    /**
     * Store a newly created board.
     */
    public function store(Request $request): JsonResponse|KanbanBoardResource
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'is_active' => 'boolean',
                'settings' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            $user = Auth::user() ?? $request->user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'User not found. Please log in again.',
                ], 401);
            }

            $board = KanbanBoard::create([
                'name' => $request->name,
                'description' => $request->description,
                'created_by' => $user->id,
                'is_active' => $request->is_active ?? true,
                'settings' => $request->settings ?? [],
            ]);

            // Create default columns for the board
            $this->createDefaultColumns($board);

            return new KanbanBoardResource($board->load('columns', 'creator'));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error in KanbanBoardController::store', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'message' => 'Failed to create kanban board.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified board with columns and tasks.
     */
    public function show($id): JsonResponse|KanbanBoardResource
    {
        try {
            $user = Auth::user() ?? request()->user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'User not found. Please log in again.',
                ], 401);
            }

            $board = KanbanBoard::where('id', $id)
                ->where('created_by', $user->id)
                ->firstOrFail();

            $board->load([
                'columns' => function ($query) {
                    $query->orderBy('position');
                },
                'columns.tasks' => function ($query) {
                    $query->orderBy('position');
                },
                'creator',
            ]);

            return new KanbanBoardResource($board);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Board not found or you do not have permission to access it'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error in KanbanBoardController::show', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'message' => 'Failed to retrieve kanban board.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update the specified board.
     */
    public function update(Request $request, $id): JsonResponse|KanbanBoardResource
    {
        try {
            $user = Auth::user() ?? $request->user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'User not found. Please log in again.',
                ], 401);
            }

            $board = KanbanBoard::where('id', $id)
                ->where('created_by', $user->id)
                ->firstOrFail();

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'is_active' => 'boolean',
                'settings' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            $board->update($request->all());

            return new KanbanBoardResource($board->load('columns', 'creator'));
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Board not found or you do not have permission to update it'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error in KanbanBoardController::update', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'message' => 'Failed to update kanban board.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified board.
     */
    public function destroy($id): Response|JsonResponse
    {
        try {
            $user = Auth::user() ?? request()->user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'User not found. Please log in again.',
                ], 401);
            }

            $board = KanbanBoard::where('id', $id)
                ->where('created_by', $user->id)
                ->firstOrFail();

            $board->delete();

            return response()->noContent();
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Board not found or you do not have permission to delete it'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error in KanbanBoardController::destroy', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'message' => 'Failed to delete kanban board.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create default columns for a board.
     */
    private function createDefaultColumns(KanbanBoard $board): void
    {
        // Default columns with colors and positions
        $columns = [
            [
                'name' => 'Backlog',
                'color' => '#64748B', // slate
                'position' => 1,
                'is_default' => true,
            ],
            [
                'name' => 'To Do',
                'color' => '#3B82F6', // blue
                'position' => 2,
                'is_default' => false,
            ],
            [
                'name' => 'In Progress',
                'color' => '#F59E0B', // amber
                'position' => 3,
                'is_default' => false,
            ],
            [
                'name' => 'Review',
                'color' => '#8B5CF6', // violet
                'position' => 4,
                'is_default' => false,
            ],
            [
                'name' => 'Done',
                'color' => '#10B981', // emerald
                'position' => 5,
                'is_default' => false,
            ],
        ];

        // Create columns for the board
        foreach ($columns as $column) {
            $board->columns()->create([
                'name' => $column['name'],
                'color' => $column['color'],
                'position' => $column['position'],
                'is_default' => $column['is_default'],
                'settings' => [],
            ]);
        }
    }
}
