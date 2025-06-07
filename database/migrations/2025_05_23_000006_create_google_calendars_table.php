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
        if (!Schema::hasTable('google_calendars')) {
            // Create the table if it doesn't exist
            Schema::create('google_calendars', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->text('access_token');
                $table->text('refresh_token')->nullable();
                $table->timestamp('token_expires_at')->nullable();
                $table->string('calendar_id');
                $table->timestamps();

                // Add unique constraint to ensure one calendar connection per user
                $table->unique('user_id');
            });
        } else {
            // Modify the table if it exists
            Schema::table('google_calendars', function (Blueprint $table) {
                // Check if columns exist before trying to drop them
                if (Schema::hasColumn('google_calendars', 'access_token')) {
                    $table->dropColumn('access_token');
                }

                if (Schema::hasColumn('google_calendars', 'refresh_token')) {
                    $table->dropColumn('refresh_token');
                }

                // Add the columns with updated data types
                if (!Schema::hasColumn('google_calendars', 'access_token')) {
                    $table->text('access_token')->after('user_id');
                }

                if (!Schema::hasColumn('google_calendars', 'refresh_token')) {
                    $table->text('refresh_token')->nullable()->after('access_token');
                }

                // Add token_expires_at if it doesn't exist
                if (!Schema::hasColumn('google_calendars', 'token_expires_at')) {
                    $table->timestamp('token_expires_at')->nullable()->after('refresh_token');
                }

                // Add calendar_id if it doesn't exist
                if (!Schema::hasColumn('google_calendars', 'calendar_id')) {
                    $table->string('calendar_id')->after('token_expires_at');
                }

                // Make sure user_id has a unique constraint
                if (!Schema::hasTable('your_generic_secretique')) {
                    try {
                        $table->unique('user_id');
                    } catch (\Exception $e) {
                        // Constraint might already exist
                    }
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Don't drop the table in down() to avoid data loss
    }
};
