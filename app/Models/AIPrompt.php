<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class AIPrompt extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'ai_prompts';

    protected $fillable = [
        'user_id',
        'group_id',
        'prompt',
        'response',
        'model_used',
        'success',
        'endpoint',
        'response_time_ms',
        'metadata',
    ];

    protected $casts = [
        'success' => 'boolean',
        'metadata' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }
}
