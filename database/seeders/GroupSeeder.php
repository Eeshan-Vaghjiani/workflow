<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Group;
use App\Models\GroupAssignment;
use App\Models\GroupTask;
use App\Models\GroupChatMessage;

class GroupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create 5 users
        $users = User::factory()->count(5)->create();

        // Create 3 groups
        $groups = Group::factory()
            ->count(3)
            ->create()
            ->each(function ($group) use ($users) {
                // Set the first member as owner
                $group->members()->attach(
                    $users->first()->id,
                    ['role' => 'owner']
                );

                // Add random members to each group (excluding the owner)
                $group->members()->attach(
                    $users->skip(1)->random(rand(2, 3))->pluck('id')->toArray(),
                    ['role' => 'member']
                );

                // Create 2-4 assignments for each group
                GroupAssignment::factory()
                    ->count(rand(2, 4))
                    ->for($group)
                    ->create()
                    ->each(function ($assignment) use ($users, $group) {
                        // Create 3-5 tasks for each assignment
                        GroupTask::factory()
                            ->count(rand(3, 5))
                            ->create([
                                'assignment_id' => $assignment->id,
                                'assigned_to' => $group->members->random()->id
                            ]);

                        // Create 5-10 chat messages for each group
                        GroupChatMessage::factory()
                            ->count(rand(5, 10))
                            ->create([
                                'group_id' => $group->id,
                                'user_id' => $group->members->random()->id
                            ]);
                    });
            });
    }
}
