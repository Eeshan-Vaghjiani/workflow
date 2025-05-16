<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Create direct messages table
        Schema::create('direct_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('receiver_id')->constrained('users')->onDelete('cascade');
            $table->text('message');
            $table->boolean('read')->default(false);
            $table->timestamps();
            
            // Add indexes for performance
            $table->index(['sender_id', 'receiver_id']);
            $table->index(['receiver_id', 'sender_id']);
        });

        // Create group chat messages table
        Schema::create('group_chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('message');
            $table->boolean('is_system_message')->default(false);
            $table->timestamps();
            
            // Add index for performance
            $table->index('group_id');
        });

        // Create notifications table
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type');
            $table->json('data');
            $table->boolean('read')->default(false);
            $table->timestamps();
            
            // Index to quickly find unread notifications
            $table->index(['user_id', 'read']);
            
            // Index to find notifications by type
            $table->index(['user_id', 'type']);
        });

        // Create Google Calendar table
        Schema::create('google_calendars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('access_token');
            $table->string('refresh_token');
            $table->timestamp('token_expires_at');
            $table->string('calendar_id')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('google_calendars');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('group_chat_messages');
        Schema::dropIfExists('direct_messages');
    }
}; 