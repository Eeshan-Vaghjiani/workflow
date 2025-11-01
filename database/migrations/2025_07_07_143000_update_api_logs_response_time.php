<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update existing records with a default response time
        DB::table('api_logs')
            ->whereNull('response_time_ms')
            ->update(['response_time_ms' => 200]); // Default 200ms response time
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse this as it's just data update
    }
};
