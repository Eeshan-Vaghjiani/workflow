<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class GroupAssignment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'group_id',
        'title',
        'unit_name',
        'priority',
        'due_date',
        'description',
        'created_by',
    ];

    protected $casts = [
        'due_date' => 'date',
    ];

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function tasks()
    {
        return $this->hasMany(GroupTask::class, 'assignment_id');
    }
}
