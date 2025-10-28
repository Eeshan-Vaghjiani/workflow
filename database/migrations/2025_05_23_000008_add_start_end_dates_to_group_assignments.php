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
        // Check if columns already exist before adding them
        if (!Schema::hasColumn('group_assignments', 'start_date')) {
            Schema::table('group_assignments', function (Blueprint $table) {
                $table->date('start_date')->after('unit_name')->nullable();
            });

            // Set start_date to created_at date for existing records
            DB::table('group_assignments')
                ->whereNull('start_date')
                ->update(['start_date' => DB::raw('DATE(created_at)')]);
        }

        if (!Schema::hasColumn('group_assignments', 'end_date')) {
            Schema::table('group_assignments', function (Blueprint $table) {
                $table->date('end_date')->after('start_date')->nullable();
            });

            // Copy due_date to end_date for existing records
            DB::table('group_assignments')
                ->whereNull('end_date')
                ->update(['end_date' => DB::raw('due_date')]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('group_assignments', 'start_date')) {
            Schema::table('group_assignments', function (Blueprint $table) {
                $table->dropColumn('start_date');
            });
        }

        if (Schema::hasColumn('group_assignments', 'end_date')) {
            Schema::table('group_assignments', function (Blueprint $table) {
                $table->dropColumn('end_date');
            });
        }
    }
};
