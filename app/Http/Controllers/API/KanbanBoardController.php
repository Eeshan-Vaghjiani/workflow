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

class KanbanBoardController extends Controller
{
    /**
     * Display a listing of the boards.
     */
    public function index(): AnonymousResourceCollection
    {
        $boards = KanbanBoard::with(['creator'])->get();

        return KanbanBoardResource::collection($boards);
    }

    /**
     * Store a newly created board.
     */
    public function store(Request $request): JsonResponse|KanbanBoardResource
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'settings' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $board = KanbanBoard::create([
            'name' => $request->name,
            'description' => $request->description,
            'created_by' => Auth::id(),
            'is_active' => $request->is_active ?? true,
            'settings' => $request->settings ?? [],
        ]);

        // Create default columns for the board
        $this->createDefaultColumns($board);

        return new KanbanBoardResource($board->load('columns', 'creator'));
    }

    /**
     * Display the specified board with columns and tasks.
     */
    public function show(KanbanBoard $board): KanbanBoardResource
    {
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
    }

    /**
     * Update the specified board.
     */
    public function update(Request $request, KanbanBoard $board): JsonResponse|KanbanBoardResource
    {
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
    }

    /**
     * Remove the specified board.
     */
    public function destroy(KanbanBoard $board): Response
    {
        $board->delete();

        return response()->noContent();
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
