<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AIUsageLog extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_id',
        'service_type',
        'prompts_used',
        'remaining_prompts_after',
    ];

    /**
     * Get the user that owns the usage log.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
