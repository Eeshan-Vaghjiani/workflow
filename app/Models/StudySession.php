<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudySession extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'session_date',
        'start_time',
        'end_time',
        'completed',
        'group_id',
        'assignment_id',
    ];

    protected $casts = [
        'session_date' => 'date',
        'completed' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function assignment()
    {
        return $this->belongsTo(GroupAssignment::class);
    }

    public function tasks()
    {
        return $this->hasMany(StudyTask::class);
    }
}
