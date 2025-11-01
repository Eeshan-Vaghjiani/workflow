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
        // No-op: Table is already created in 2024_05_08_000000_create_chat_and_calendar_tables.php
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op: Table is managed by 2024_05_08_000000_create_chat_and_calendar_tables.php
    }
};
