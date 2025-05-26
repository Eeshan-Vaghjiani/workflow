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
        // Add indexes to group_tasks table
        Schema::table('group_tasks', function (Blueprint $table) {
            $table->index('assigned_user_id');
            $table->index('status');
            $table->index(['assignment_id', 'status']);
            $table->index(['assignment_id', 'assigned_user_id']);
        });

        // Add indexes to group_assignments table
        Schema::table('group_assignments', function (Blueprint $table) {
            $table->index('status');
            $table->index(['group_id', 'status']);
            $table->index('due_date');
        });

        // Add indexes to group_messages table
        if (Schema::hasTable('group_messages')) {
            Schema::table('group_messages', function (Blueprint $table) {
                $table->index('created_at');
                $table->index(['group_id', 'created_at']);
            });
        }

        // Add indexes to direct_messages table
        if (Schema::hasTable('direct_messages')) {
            Schema::table('direct_messages', function (Blueprint $table) {
                $table->index(['sender_id', 'receiver_id']);
                $table->index(['receiver_id', 'read']);
                $table->index('created_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove indexes from group_tasks table
        Schema::table('group_tasks', function (Blueprint $table) {
            $table->dropIndex(['assigned_user_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['assignment_id', 'status']);
            $table->dropIndex(['assignment_id', 'assigned_user_id']);
        });

        // Remove indexes from group_assignments table
        Schema::table('group_assignments', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['group_id', 'status']);
            $table->dropIndex(['due_date']);
        });

        // Remove indexes from group_messages table
        if (Schema::hasTable('group_messages')) {
            Schema::table('group_messages', function (Blueprint $table) {
                $table->dropIndex(['created_at']);
                $table->dropIndex(['group_id', 'created_at']);
            });
        }

        // Remove indexes from direct_messages table
        if (Schema::hasTable('direct_messages')) {
            Schema::table('direct_messages', function (Blueprint $table) {
                $table->dropIndex(['sender_id', 'receiver_id']);
                $table->dropIndex(['receiver_id', 'read']);
                $table->dropIndex(['created_at']);
            });
        }
    }
};
