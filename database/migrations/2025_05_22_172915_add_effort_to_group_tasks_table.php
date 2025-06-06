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
            $table->integer('effort_hours')->default(1)->after('priority')->comment('Estimated effort in hours');
            $table->integer('importance')->default(1)->after('effort_hours')->comment('Task importance on scale 1-5');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('group_tasks', function (Blueprint $table) {
            $table->dropColumn('effort_hours');
            $table->dropColumn('importance');
        });
    }
};
