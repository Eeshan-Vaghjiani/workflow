<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Notification extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'type',
        'data',
        'read',
    ];

    protected $casts = [
        'data' => 'array',
        'read' => 'boolean',
        'deleted_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function task()
    {
        if ($this->type === 'task_assignment' || $this->type === 'deadline_reminder') {
            return $this->belongsTo(GroupTask::class, 'data->task_id');
        }

        return null;
    }

    public function group()
    {
        if (isset($this->data['group_id'])) {
            return $this->belongsTo(Group::class, 'data->group_id');
        }

        return null;
    }
}
