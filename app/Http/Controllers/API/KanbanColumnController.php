<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\KanbanColumnResource;
use App\Models\KanbanColumn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Validator;

class KanbanColumnController extends Controller
{
    /**
     * Store a newly created column.
     */
    public function store(Request $request): JsonResponse|KanbanColumnResource
    {
        $validator = Validator::make($request->all(), [
            'board_id' => 'required|exists:kanban_boards,id',
            'name' => 'required|string|max:255',
            'color' => 'required|string|max:20',
            'position' => 'required|integer|min:0',
            'is_default' => 'boolean',
            'settings' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $column = KanbanColumn::create($request->all());

        return new KanbanColumnResource($column);
    }

    /**
     * Update the specified column.
     */
    public function update(Request $request, KanbanColumn $column): JsonResponse|KanbanColumnResource
    {
        $validator = Validator::make($request->all(), [
            'name' => 'string|max:255',
            'color' => 'string|max:20',
            'position' => 'integer|min:0',
            'is_default' => 'boolean',
            'settings' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $column->update($request->all());

        return new KanbanColumnResource($column);
    }

    /**
     * Remove the specified column.
     */
    public function destroy(KanbanColumn $column): Response
    {
        $column->delete();

        return response()->noContent();
    }

    /**
     * Reorder columns.
     */
    public function reorder(Request $request): JsonResponse|AnonymousResourceCollection
    {
        $validator = Validator::make($request->all(), [
            'columns' => 'required|array',
            'columns.*.id' => 'required|exists:kanban_columns,id',
            'columns.*.position' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        foreach ($request->columns as $columnData) {
            KanbanColumn::where('id', $columnData['id'])->update(['position' => $columnData['position']]);
        }

        // Get the board_id from the first column to return all columns from this board
        $firstColumn = KanbanColumn::find($request->columns[0]['id']);
        $columns = KanbanColumn::where('board_id', $firstColumn->board_id)
            ->orderBy('position')
            ->get();

        return KanbanColumnResource::collection($columns);
    }
}
