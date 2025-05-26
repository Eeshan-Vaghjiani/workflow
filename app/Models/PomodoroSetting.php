<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PomodoroSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'focus_minutes',
        'short_break_minutes',
        'long_break_minutes',
        'long_break_interval',
        'auto_start_breaks',
        'auto_start_pomodoros',
        'notifications_enabled',
    ];

    protected $casts = [
        'focus_minutes' => 'integer',
        'short_break_minutes' => 'integer',
        'long_break_minutes' => 'integer',
        'long_break_interval' => 'integer',
        'auto_start_breaks' => 'boolean',
        'auto_start_pomodoros' => 'boolean',
        'notifications_enabled' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
