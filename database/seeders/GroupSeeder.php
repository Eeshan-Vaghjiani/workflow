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
        // Get all users
        $users = User::all();
        $evaUser = User::where('email', 'evaghjiani@gmail.com')->first();

        // Create groups with Eva as the owner
        $groups = [
            [
                'name' => 'Marketing Team',
                'description' => 'Planning and execution of marketing campaigns',
                'owner_id' => $evaUser->id,
            ],
            [
                'name' => 'Development Team',
                'description' => 'Software development and bug fixes',
                'owner_id' => $evaUser->id,
            ],
            [
                'name' => 'Project Alpha',
                'description' => 'Confidential project for client X',
                'owner_id' => $evaUser->id,
            ],
        ];

        foreach ($groups as $groupData) {
            $group = Group::create($groupData);

            // Add Eva as owner
            $group->members()->attach($evaUser->id, ['role' => 'leader']);

            // Add random users to the group with different roles
            $otherUsers = $users->where('id', '!=', $evaUser->id)->shuffle();

            // Add 2-3 members with different roles
            $roles = ['leader', 'member'];
            for ($i = 0; $i < rand(2, 3); $i++) {
                if (isset($otherUsers[$i])) {
                    $role = $roles[array_rand($roles)];
                    $group->members()->attach($otherUsers[$i]->id, ['role' => $role]);
                }
            }
        }

        // Create a group with another user as owner and Eva as member
        $anotherOwner = $users->where('id', '!=', $evaUser->id)->first();
        $anotherGroup = Group::create([
            'name' => 'Client Project',
            'description' => 'Work for client Y',
            'owner_id' => $anotherOwner->id,
        ]);

        // Add the owner
        $anotherGroup->members()->attach($anotherOwner->id, ['role' => 'leader']);

        // Add Eva as member
        $anotherGroup->members()->attach($evaUser->id, ['role' => 'member']);

        // Add some other members
        $otherMembers = $users->where('id', '!=', $anotherOwner->id)
            ->where('id', '!=', $evaUser->id)
            ->shuffle()
            ->take(2);

        foreach ($otherMembers as $member) {
            $anotherGroup->members()->attach($member->id, ['role' => 'member']);
        }
    }
}
