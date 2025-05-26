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
        // Helper function to check if an index exists
        $indexExists = function($table, $index) {
            return collect(DB::select("SHOW INDEXES FROM {$table} WHERE Key_name = '{$index}'"))->isNotEmpty();
        };

        // Add indexes to group_tasks table
        Schema::table('group_tasks', function (Blueprint $table) use ($indexExists) {
            if (!$indexExists('group_tasks', 'group_tasks_assigned_user_id_index')) {
                $table->index('assigned_user_id');
            }
            if (!$indexExists('group_tasks', 'group_tasks_status_index')) {
                $table->index('status');
            }
            if (!$indexExists('group_tasks', 'group_tasks_assignment_id_status_index')) {
                $table->index(['assignment_id', 'status']);
            }
            if (!$indexExists('group_tasks', 'group_tasks_assignment_id_assigned_user_id_index')) {
                $table->index(['assignment_id', 'assigned_user_id']);
            }
        });

        // Add indexes to group_assignments table
        Schema::table('group_assignments', function (Blueprint $table) use ($indexExists) {
            if (!$indexExists('group_assignments', 'group_assignments_status_index')) {
                $table->index('status');
            }
            if (!$indexExists('group_assignments', 'group_assignments_group_id_status_index')) {
                $table->index(['group_id', 'status']);
            }
            if (!$indexExists('group_assignments', 'group_assignments_due_date_index')) {
                $table->index('due_date');
            }
        });

        // Add indexes to group_messages table
        if (Schema::hasTable('group_messages')) {
            Schema::table('group_messages', function (Blueprint $table) use ($indexExists) {
                if (!$indexExists('group_messages', 'group_messages_created_at_index')) {
                    $table->index('created_at');
                }
                if (!$indexExists('group_messages', 'group_messages_group_id_created_at_index')) {
                    $table->index(['group_id', 'created_at']);
                }
            });
        }

        // Add indexes to direct_messages table
        if (Schema::hasTable('direct_messages')) {
            Schema::table('direct_messages', function (Blueprint $table) use ($indexExists) {
                if (!$indexExists('direct_messages', 'direct_messages_sender_id_receiver_id_index')) {
                    $table->index(['sender_id', 'receiver_id']);
                }
                if (!$indexExists('direct_messages', 'direct_messages_receiver_id_read_index')) {
                    $table->index(['receiver_id', 'read']);
                }
                if (!$indexExists('direct_messages', 'direct_messages_created_at_index')) {
                    $table->index('created_at');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We'll avoid errors by not trying to drop non-existent indexes
        try {
            // Remove indexes from group_tasks table
            if (Schema::hasTable('group_tasks')) {
                Schema::table('group_tasks', function (Blueprint $table) {
                    $table->dropIndex(['assigned_user_id']);
                    $table->dropIndex(['status']);
                    $table->dropIndex(['assignment_id', 'status']);
                    $table->dropIndex(['assignment_id', 'assigned_user_id']);
                });
            }
        } catch (\Exception $e) {
            // Ignore errors from non-existent indexes
        }

        try {
            // Remove indexes from group_assignments table
            if (Schema::hasTable('group_assignments')) {
                Schema::table('group_assignments', function (Blueprint $table) {
                    $table->dropIndex(['status']);
                    $table->dropIndex(['group_id', 'status']);
                    $table->dropIndex(['due_date']);
                });
            }
        } catch (\Exception $e) {
            // Ignore errors
        }

        try {
            // Remove indexes from group_messages table
            if (Schema::hasTable('group_messages')) {
                Schema::table('group_messages', function (Blueprint $table) {
                    $table->dropIndex(['created_at']);
                    $table->dropIndex(['group_id', 'created_at']);
                });
            }
        } catch (\Exception $e) {
            // Ignore errors
        }

        try {
            // Remove indexes from direct_messages table
            if (Schema::hasTable('direct_messages')) {
                Schema::table('direct_messages', function (Blueprint $table) {
                    $table->dropIndex(['sender_id', 'receiver_id']);
                    $table->dropIndex(['receiver_id', 'read']);
                    $table->dropIndex(['created_at']);
                });
            }
        } catch (\Exception $e) {
            // Ignore errors
        }
    }
};
