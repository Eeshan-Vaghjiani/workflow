<?php

namespace Database\Seeders;

use App\Models\Group;
use App\Models\GroupChatMessage;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class GroupChatSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all groups
        $groups = Group::with('members')->get();
        
        // Sample messages to use
        $sampleMessages = [
            "Hey everyone! How's the project going?",
            "I just finished the task assigned to me.",
            "Can we schedule a meeting for tomorrow?",
            "Has anyone started working on the design?",
            "I'm having trouble with the API integration.",
            "Just pushed my changes to the repo.",
            "Great work on the presentation yesterday!",
            "Who's responsible for the documentation?",
            "I'll be out of office tomorrow, just FYI.",
            "The client loved our proposal!",
            "Can someone help me with this issue?",
            "Don't forget about the deadline on Friday.",
            "I've shared the resources in the drive folder.",
            "Any updates on the marketing materials?",
            "We need to revise our strategy.",
            "Let's have a quick call to discuss this.",
            "I've updated the task board with new items.",
            "The testing phase will start next week.",
            "Anyone available for a code review?",
            "Just sent the weekly report to the stakeholders."
        ];
        
        // Add chat messages to each group
        foreach ($groups as $group) {
            // Create 10-20 messages for each group
            $messageCount = rand(10, 20);
            $members = $group->members;
            
            // Base timestamp for ordering messages
            $baseTimestamp = Carbon::now()->subDays(7);
            
            for ($i = 0; $i < $messageCount; $i++) {
                // Pick a random member and message
                $member = $members->random();
                $message = $sampleMessages[array_rand($sampleMessages)];
                
                // Add some time progression
                $baseTimestamp = $baseTimestamp->addMinutes(rand(15, 240));
                
                GroupChatMessage::create([
                    'group_id' => $group->id,
                    'user_id' => $member->id,
                    'message' => $message,
                    'created_at' => $baseTimestamp,
                    'updated_at' => $baseTimestamp,
                ]);
            }
            
            // Add a system message
            GroupChatMessage::create([
                'group_id' => $group->id,
                'user_id' => $group->owner_id,
                'message' => 'Welcome to the group!',
                'is_system_message' => true,
                'created_at' => $baseTimestamp->subDays(7),
                'updated_at' => $baseTimestamp->subDays(7),
            ]);
        }
    }
} 