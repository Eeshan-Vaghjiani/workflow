<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('groups', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('avatar')->nullable();
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('group_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('role', ['owner', 'admin', 'member'])->default('member');
            $table->timestamps();

            $table->unique(['group_id', 'user_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('group_user');
        Schema::dropIfExists('groups');
    }
};