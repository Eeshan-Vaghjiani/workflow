<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MpesaTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'phone_number',
        'amount',
        'transaction_code',
        'merchant_request_id',
        'checkout_request_id',
        'result_code',
        'result_description',
        'status',
        'transaction_details',
    ];

    protected $casts = [
        'transaction_details' => 'array',
        'amount' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
