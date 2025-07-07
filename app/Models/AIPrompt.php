<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class AiPrompt extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'ai_prompts';

    protected $fillable = [
        'user_id',
        'prompt',
        'response',
        'model',
        'tokens_used',
        'completion_time'
    ];

    protected $casts = [
        'tokens_used' => 'integer',
        'completion_time' => 'float',
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
