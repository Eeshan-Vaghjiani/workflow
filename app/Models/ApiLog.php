<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ApiLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'service',
        'model',
        'user_id',
        'status_code',
        'response_time_ms',
        'request_payload',
        'response_payload',
    ];
}
