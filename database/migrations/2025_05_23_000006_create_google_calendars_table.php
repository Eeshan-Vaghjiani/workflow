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
        // Check if the table exists before trying to modify it
        if (Schema::hasTable('google_calendars')) {
            Schema::table('google_calendars', function (Blueprint $table) {
                // Drop existing columns that will be replaced
                $table->dropColumn('access_token');
                $table->dropColumn('refresh_token');

                // Add the columns with updated data types
                $table->text('access_token')->after('user_id');
                $table->text('refresh_token')->nullable()->after('access_token');

                // Modify token_expires_at to be nullable if it's not already
                if (Schema::hasColumn('google_calendars', 'token_expires_at')) {
                    $table->timestamp('token_expires_at')->nullable()->change();
                }

                // Make calendar_id not nullable if it's currently nullable
                if (Schema::hasColumn('google_calendars', 'calendar_id')) {
                    $table->string('calendar_id')->nullable(false)->change();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('google_calendars')) {
            Schema::table('google_calendars', function (Blueprint $table) {
                // Revert the changes by replacing the columns
                $table->dropColumn('access_token');
                $table->dropColumn('refresh_token');

                // Add back the original columns
                $table->string('access_token')->after('user_id');
                $table->string('refresh_token')->after('access_token');

                // Make token_expires_at not nullable
                $table->timestamp('token_expires_at')->nullable(false)->change();

                // Make calendar_id nullable again
                $table->string('calendar_id')->nullable()->change();
            });
        }
    }
};
