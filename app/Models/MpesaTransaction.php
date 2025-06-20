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
        'confirmed_phone_number',
        'amount',
        'confirmed_amount',
        'transaction_date',
        'transaction_code',
        'merchant_request_id',
        'checkout_request_id',
        'mpesa_receipt_number',
        'result_code',
        'result_desc',
        'status',
        'transaction_details',
    ];

    protected $casts = [
        'transaction_details' => 'array',
        'amount' => 'decimal:2',
        'confirmed_amount' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
