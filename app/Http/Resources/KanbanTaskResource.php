<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KanbanTaskResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'board_id' => $this->board_id,
            'column_id' => $this->column_id,
            'title' => $this->title,
            'description' => $this->description,
            'priority' => $this->priority,
            'assigned_to' => $this->assigned_to,
            'created_by' => $this->created_by,
            'due_date' => $this->due_date,
            'position' => $this->position,
            'tags' => $this->tags,
            'attachments' => $this->attachments,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'assigned_user' => $this->when($this->relationLoaded('assignedUser'), function () {
                return new UserResource($this->assignedUser);
            }),
            'created_user' => $this->when($this->relationLoaded('creator'), function () {
                return new UserResource($this->creator);
            }),
        ];
    }
}
