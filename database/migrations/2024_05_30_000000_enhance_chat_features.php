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
        // Add parent_id to direct_messages for replies
        Schema::table('direct_messages', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->references('id')->on('direct_messages')->onDelete('set null');
            if (!Schema::hasColumn('direct_messages', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        // Add parent_id to group_messages for replies (group_messages already has softDeletes)
        Schema::table('group_messages', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->references('id')->on('group_messages')->onDelete('set null');
        });

        // Create pinned_messages table
        Schema::create('pinned_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('message_id');
            $table->string('message_type'); // 'direct' or 'group'
            $table->unsignedBigInteger('chat_id'); // direct_message receiver_id or group_id
            $table->timestamps();

            // Composite unique to prevent duplicates
            $table->unique(['message_id', 'message_type', 'chat_id']);
        });

        // Create message_attachments table
        Schema::create('message_attachments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('message_id');
            $table->string('message_type'); // 'direct' or 'group'
            $table->string('file_path');
            $table->string('file_name');
            $table->string('file_type');
            $table->bigInteger('file_size')->unsigned();
            $table->timestamps();

            $table->index(['message_id', 'message_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove parent_id from direct_messages
        Schema::table('direct_messages', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn('parent_id');
            if (Schema::hasColumn('direct_messages', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });

        // Remove parent_id from group_messages
        Schema::table('group_messages', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn('parent_id');
        });

        // Drop pinned_messages table
        Schema::dropIfExists('pinned_messages');

        // Drop message_attachments table
        Schema::dropIfExists('message_attachments');
    }
};
