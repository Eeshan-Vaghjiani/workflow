<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            GroupSeeder::class,
            GroupAssignmentSeeder::class,
            GroupChatSeeder::class,
            DirectMessageSeeder::class,
            GroupMessageSeeder::class,
            AdminUserSeeder::class,
            PricingPackageSeeder::class,
        ]);

        $this->call(KanbanDummyDataSeeder::class);
    }
}
