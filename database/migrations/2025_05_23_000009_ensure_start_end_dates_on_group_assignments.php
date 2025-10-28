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
        // This migration serves as a fallback to ensure start_date and end_date exist
        // Check if columns already exist before adding them
        if (!Schema::hasColumn('group_assignments', 'start_date')) {
            Schema::table('group_assignments', function (Blueprint $table) {
                $table->date('start_date')->after('unit_name')->nullable();
            });
        }

        if (!Schema::hasColumn('group_assignments', 'end_date')) {
            Schema::table('group_assignments', function (Blueprint $table) {
                $table->date('end_date')->after('start_date')->nullable();
            });
        }

        // Set default values for existing records
        DB::statement('UPDATE group_assignments SET start_date = DATE(created_at) WHERE start_date IS NULL');
        DB::statement('UPDATE group_assignments SET end_date = due_date WHERE end_date IS NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Don't drop the columns in down() as they might be needed by other migrations
    }
};
