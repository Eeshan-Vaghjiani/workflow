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
        Schema::table('group_user', function (Blueprint $table) {
            if (!Schema::hasColumn('group_user', 'role')) {
                $table->enum('role', ['owner', 'admin', 'member'])->default('member')->after('user_id');
            }
            
            if (Schema::hasColumn('group_user', 'is_leader')) {
                $table->dropColumn('is_leader');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('group_user', function (Blueprint $table) {
            if (Schema::hasColumn('group_user', 'role')) {
                $table->dropColumn('role');
            }
            
            if (!Schema::hasColumn('group_user', 'is_leader')) {
                $table->boolean('is_leader')->default(false)->after('user_id');
            }
        });
    }
}; 