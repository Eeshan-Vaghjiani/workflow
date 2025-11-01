<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\GroupMessage;
use App\Models\Group;
use App\Models\User;

class GroupMessageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all groups and users for seeding messages
        $groups = Group::all();
        $users = User::all();

        if ($groups->isEmpty() || $users->isEmpty()) {
            $this->command->info('No groups or users found. Skipping GroupMessage seeding.');
            return;
        }

        // Create sample messages for each group
        foreach ($groups as $group) {
            $groupMembers = $group->members()->pluck('user_id')->toArray();
            
            if (empty($groupMembers)) {
                continue;
            }

            // Create 5-10 messages per group
            $messageCount = rand(5, 10);
            for ($i = 0; $i < $messageCount; $i++) {
                $userId = $groupMembers[array_rand($groupMembers)];
                
                GroupMessage::create([
                    'group_id' => $group->id,
                    'user_id' => $userId,
                    'message' => $this->getRandomMessage(),
                    'created_at' => now()->subHours(rand(1, 72))->addMinutes(rand(1, 59)),
                ]);
            }
        }
    }

    /**
     * Get a random message for seeding.
     */
    private function getRandomMessage(): string
    {
        $messages = [
            'Hello everyone!',
            'How is the project going?',
            'I need help with the assignment!',
            'Does anyone have the notes from yesterday?',
            'When is our next meeting?',
            'I finished my part of the project.',
            'Has anyone started on the research yet?',
            'The deadline is coming up soon!',
            'Great job on the presentation!',
            'Let me know if you need any help.',
            'I shared some resources in the group drive.',
            'Can we reschedule the meeting?',
            'I won\'t be able to make it tomorrow.',
            'Did everyone submit their parts?',
            'What time should we meet on Friday?',
        ];

        return $messages[array_rand($messages)];
    }
} 