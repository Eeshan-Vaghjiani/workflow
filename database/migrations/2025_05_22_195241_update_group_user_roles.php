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
        // Add a temporary column
        Schema::table('group_user', function (Blueprint $table) {
            $table->string('new_role')->nullable()->after('role');
        });

        // Update the temporary column based on the old role
        DB::table('group_user')
            ->whereIn('role', ['owner', 'admin'])
            ->update(['new_role' => 'leader']);

        DB::table('group_user')
            ->where('role', 'member')
            ->update(['new_role' => 'member']);

        // Drop the old role column
        Schema::table('group_user', function (Blueprint $table) {
            $table->dropColumn('role');
        });

        // Add the new role column
        Schema::table('group_user', function (Blueprint $table) {
            $table->enum('role', ['leader', 'member'])->default('member')->after('user_id');
        });

        // Copy data from temporary column to new role column
        DB::table('group_user')
            ->update(['role' => DB::raw('new_role')]);

        // Drop the temporary column
        Schema::table('group_user', function (Blueprint $table) {
            $table->dropColumn('new_role');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add a temporary column
        Schema::table('group_user', function (Blueprint $table) {
            $table->string('old_role')->nullable()->after('role');
        });

        // Update the temporary column based on the current role
        DB::table('group_user')
            ->where('role', 'leader')
            ->update(['old_role' => 'owner']);

        DB::table('group_user')
            ->where('role', 'member')
            ->update(['old_role' => 'member']);

        // Drop the current role column
        Schema::table('group_user', function (Blueprint $table) {
            $table->dropColumn('role');
        });

        // Add the old role column
        Schema::table('group_user', function (Blueprint $table) {
            $table->enum('role', ['owner', 'admin', 'member'])->default('member')->after('user_id');
        });

        // Copy data from temporary column to old role column
        DB::table('group_user')
            ->update(['role' => DB::raw('old_role')]);

        // Drop the temporary column
        Schema::table('group_user', function (Blueprint $table) {
            $table->dropColumn('old_role');
        });
    }
};
