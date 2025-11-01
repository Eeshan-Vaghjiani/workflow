<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Doctrine\DBAL\Schema\SchemaException;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('group_tasks', function (Blueprint $table) {
            $table->renameColumn('assigned_to', 'assigned_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('group_tasks', function (Blueprint $table) {
            $table->renameColumn('assigned_user_id', 'assigned_to');
        });
    }
};
