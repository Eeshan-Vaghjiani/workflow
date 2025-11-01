<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KanbanTask extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'board_id',
        'column_id',
        'title',
        'description',
        'priority',
        'assigned_to',
        'created_by',
        'due_date',
        'position',
        'tags',
        'attachments',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'due_date' => 'date',
        'tags' => 'array',
        'attachments' => 'array',
    ];

    /**
     * Get the board that owns the task.
     */
    public function board(): BelongsTo
    {
        return $this->belongsTo(KanbanBoard::class, 'board_id');
    }

    /**
     * Get the column that owns the task.
     */
    public function column(): BelongsTo
    {
        return $this->belongsTo(KanbanColumn::class, 'column_id');
    }

    /**
     * Get the user who is assigned to the task.
     */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get the user who created the task.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
