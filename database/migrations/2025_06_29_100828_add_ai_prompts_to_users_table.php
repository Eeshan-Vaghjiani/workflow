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
        Schema::table('users', function (Blueprint $table) {
            $table->integer('ai_prompts_remaining')->default(10);
            $table->boolean('is_paid_user')->default(false);
            $table->timestamp('last_payment_date')->nullable();
            $table->integer('total_prompts_purchased')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'ai_prompts_remaining',
                'is_paid_user',
                'last_payment_date',
                'total_prompts_purchased'
            ]);
        });
    }
};
