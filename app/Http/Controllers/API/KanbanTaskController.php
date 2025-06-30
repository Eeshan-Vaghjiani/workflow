<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\KanbanTaskResource;
use App\Models\KanbanTask;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class KanbanTaskController extends Controller
{
    /**
     * Store a newly created task.
     */
    public function store(Request $request): JsonResponse|KanbanTaskResource
    {
        $validator = Validator::make($request->all(), [
            'board_id' => 'required|exists:kanban_boards,id',
            'column_id' => 'required|exists:kanban_columns,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|in:low,medium,high,urgent',
            'assigned_to' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
            'position' => 'required|integer|min:0',
            'tags' => 'nullable|array',
            'attachments' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Add created_by user ID
        $data = $request->all();
        $data['created_by'] = Auth::id();

        $task = KanbanTask::create($data);

        return new KanbanTaskResource($task->load(['assignedUser', 'creator']));
    }

    /**
     * Update the specified task.
     */
    public function update(Request $request, KanbanTask $task): JsonResponse|KanbanTaskResource
    {
        $validator = Validator::make($request->all(), [
            'title' => 'string|max:255',
            'description' => 'nullable|string',
            'priority' => 'in:low,medium,high,urgent',
            'assigned_to' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
            'position' => 'integer|min:0',
            'tags' => 'nullable|array',
            'attachments' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $task->update($request->all());

        return new KanbanTaskResource($task->load(['assignedUser', 'creator']));
    }

    /**
     * Remove the specified task.
     */
    public function destroy(KanbanTask $task): Response
    {
        $task->delete();

        return response()->noContent();
    }

    /**
     * Move a task to a different column.
     */
    public function move(Request $request): JsonResponse|KanbanTaskResource
    {
        $validator = Validator::make($request->all(), [
            'task_id' => 'required|exists:kanban_tasks,id',
            'column_id' => 'required|exists:kanban_columns,id',
            'position' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $task = KanbanTask::findOrFail($request->task_id);
        $task->update([
            'column_id' => $request->column_id,
            'position' => $request->position,
        ]);

        return new KanbanTaskResource($task->load(['assignedUser', 'creator']));
    }

    /**
     * Reorder tasks within a column.
     */
    public function reorder(Request $request): JsonResponse|AnonymousResourceCollection
    {
        $validator = Validator::make($request->all(), [
            'column_id' => 'required|exists:kanban_columns,id',
            'tasks' => 'required|array',
            'tasks.*.id' => 'required|exists:kanban_tasks,id',
            'tasks.*.position' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        foreach ($request->tasks as $taskData) {
            KanbanTask::where('id', $taskData['id'])->update(['position' => $taskData['position']]);
        }

        $tasks = KanbanTask::where('column_id', $request->column_id)
            ->orderBy('position')
            ->get();

        return KanbanTaskResource::collection($tasks);
    }
}
