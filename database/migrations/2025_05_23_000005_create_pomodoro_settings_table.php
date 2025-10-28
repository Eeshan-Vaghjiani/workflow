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
        Schema::create('pomodoro_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->unsignedInteger('focus_minutes')->default(25);
            $table->unsignedInteger('short_break_minutes')->default(5);
            $table->unsignedInteger('long_break_minutes')->default(15);
            $table->unsignedInteger('long_break_interval')->default(4);
            $table->boolean('auto_start_breaks')->default(true);
            $table->boolean('auto_start_pomodoros')->default(true);
            $table->boolean('notifications_enabled')->default(true);
            $table->boolean('is_deleted')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('pomodoro_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->dateTime('started_at');
            $table->dateTime('ended_at')->nullable();
            $table->enum('type', ['focus', 'short_break', 'long_break']);
            $table->unsignedInteger('duration_minutes');
            $table->boolean('completed')->default(false);
            $table->foreignId('task_id')->nullable()->constrained('group_tasks')->onDelete('set null');
            $table->boolean('is_deleted')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pomodoro_sessions');
        Schema::dropIfExists('pomodoro_settings');
    }
};
