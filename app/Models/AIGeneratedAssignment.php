<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class AIGeneratedAssignment extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'your_generic_secret';

    protected $fillable = [
        'group_id',
        'assignment_id',
        'original_prompt',
        'ai_response',
        'model_used',
        'task_distribution',
        'created_by',
    ];

    protected $casts = [
        'task_distribution' => 'array',
    ];

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function assignment()
    {
        return $this->belongsTo(GroupAssignment::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
