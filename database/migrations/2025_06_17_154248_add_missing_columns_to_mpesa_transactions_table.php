<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('mpesa_transactions', function (Blueprint $table) {
            // Add the missing columns
            if (!Schema::hasColumn('mpesa_transactions', 'result_desc')) {
                $table->string('result_desc')->nullable()->after('result_code');
            }
            if (!Schema::hasColumn('mpesa_transactions', 'mpesa_receipt_number')) {
                $table->string('mpesa_receipt_number')->nullable()->after('checkout_request_id');
            }
            if (!Schema::hasColumn('mpesa_transactions', 'confirmed_amount')) {
                $table->decimal('confirmed_amount', 10, 2)->nullable()->after('amount');
            }
            if (!Schema::hasColumn('mpesa_transactions', 'transaction_date')) {
                $table->string('transaction_date')->nullable()->after('confirmed_amount');
            }
            if (!Schema::hasColumn('mpesa_transactions', 'confirmed_phone_number')) {
                $table->string('confirmed_phone_number')->nullable()->after('phone_number');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mpesa_transactions', function (Blueprint $table) {
            $table->dropColumn([
                'result_desc',
                'mpesa_receipt_number',
                'confirmed_amount',
                'transaction_date',
                'confirmed_phone_number'
            ]);
        });
    }
};
