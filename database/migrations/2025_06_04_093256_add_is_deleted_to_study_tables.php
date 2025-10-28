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
        Schema::table('study_sessions', function (Blueprint $table) {
            $table->boolean('is_deleted')->default(false)->after('completed');
        });

        Schema::table('study_tasks', function (Blueprint $table) {
            $table->boolean('is_deleted')->default(false)->after('completed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('study_sessions', function (Blueprint $table) {
            $table->dropColumn('is_deleted');
        });

        Schema::table('study_tasks', function (Blueprint $table) {
            $table->dropColumn('is_deleted');
        });
    }
};
