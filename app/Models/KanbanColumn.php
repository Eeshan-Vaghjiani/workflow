<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KanbanColumn extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'board_id',
        'name',
        'color',
        'position',
        'is_default',
        'settings',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_default' => 'boolean',
        'settings' => 'array',
    ];

    /**
     * Append additional attributes to the model.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'task_count',
    ];

    /**
     * Get the board that owns the column.
     */
    public function board(): BelongsTo
    {
        return $this->belongsTo(KanbanBoard::class, 'board_id');
    }

    /**
     * Get the tasks associated with the column.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(KanbanTask::class, 'column_id')->orderBy('position');
    }

    /**
     * Get the task count for the column.
     */
    public function getTaskCountAttribute(): int
    {
        return $this->tasks()->count();
    }
}
