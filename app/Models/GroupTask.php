<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 */
class GroupTask extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'status',
        'start_date',
        'end_date',
        'assigned_user_id',
        'created_by',
        'completed_by',
        'assignment_id',
        'order_index',
        'effort_hours',
        'importance',
        'priority',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'effort_hours' => 'float',
        'importance' => 'integer',
        'priority' => 'string',
    ];

    protected $with = ['assigned_user', 'creator'];

    protected $attributes = [
        'status' => 'pending',
        'priority' => 'medium',
        'effort_hours' => 1,
        'importance' => 1,
        'order_index' => 0
    ];

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(GroupAssignment::class, 'assignment_id');
    }

    public function assigned_user()
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by')->withDefault([
            'name' => 'System'
        ]);
    }

    public function completer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by')->withDefault([
            'name' => 'System'
        ]);
    }

    public function attachments()
    {
        return $this->hasMany(TaskAttachment::class, 'task_id');
    }

    // Helper method to check if task is assigned
    public function isAssigned()
    {
        return !is_null($this->assigned_to);
    }

    // Helper method to check if task is completed
    public function isCompleted()
    {
        return $this->status === 'completed';
    }

    // Helper method to get task progress
    public function getProgressAttribute()
    {
        return $this->status === 'completed' ? 100 : ($this->status === 'in_progress' ? 50 : 0);
    }

    // Helper method to get task effort
    public function getEffortAttribute()
    {
        return $this->effort_hours ?? 1;
    }

    // Helper method to get task importance
    public function getImportanceAttribute()
    {
        return $this->importance ?? 1;
    }
}
