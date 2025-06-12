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
        Schema::table('group_tasks', function (Blueprint $table) {
            $table->integer('progress')->default(0)->after('order_index')->comment('Task progress percentage (0-100)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('group_tasks', function (Blueprint $table) {
            $table->dropColumn('progress');
        });
    }
};
