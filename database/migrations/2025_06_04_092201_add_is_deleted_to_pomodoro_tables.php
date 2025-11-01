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
        // Check if is_deleted column doesn't exist in pomodoro_settings
        if (!Schema::hasColumn('pomodoro_settings', 'is_deleted')) {
            Schema::table('pomodoro_settings', function (Blueprint $table) {
                $table->boolean('is_deleted')->default(false)->after('notifications_enabled');
            });
        }

        // Check if is_deleted column doesn't exist in pomodoro_sessions
        if (!Schema::hasColumn('pomodoro_sessions', 'is_deleted')) {
            Schema::table('pomodoro_sessions', function (Blueprint $table) {
                $table->boolean('is_deleted')->default(false)->after('task_id');
            });
        }

        // Add soft deletes to pomodoro_settings if it doesn't exist
        if (!Schema::hasColumn('pomodoro_settings', 'deleted_at')) {
            Schema::table('pomodoro_settings', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        // Add soft deletes to pomodoro_sessions if it doesn't exist
        if (!Schema::hasColumn('pomodoro_sessions', 'deleted_at')) {
            Schema::table('pomodoro_sessions', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove is_deleted column from pomodoro_settings
        Schema::table('pomodoro_settings', function (Blueprint $table) {
            $table->dropColumn('is_deleted');
            $table->dropSoftDeletes();
        });

        // Remove is_deleted column from pomodoro_sessions
        Schema::table('pomodoro_sessions', function (Blueprint $table) {
            $table->dropColumn('is_deleted');
            $table->dropSoftDeletes();
        });
    }
};
