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
        Schema::create('pricing_packages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->integer('prompts_count');
            $table->decimal('price', 10, 2);
            $table->string('currency', 3)->default('KES');
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->json('features')->nullable();
            $table->boolean('is_popular')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pricing_packages');
    }
};
