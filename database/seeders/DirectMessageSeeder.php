<?php

namespace Database\Seeders;

use App\Models\DirectMessage;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DirectMessageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get Eva and all other users
        $eva = User::where('email', 'evaghjiani@gmail.com')->first();
        $otherUsers = User::where('id', '!=', $eva->id)->get();
        
        // Sample messages
        $sampleMessages = [
            "Hi there! How are you doing today?",
            "Did you get a chance to review the document I sent yesterday?",
            "I'm available for a meeting this afternoon if you're free.",
            "Just wanted to check in on the project status.",
            "Could you please provide feedback on my proposal?",
            "Have you seen the latest updates to the system?",
            "Thanks for your help earlier!",
            "Let's catch up sometime this week.",
            "I've finished the task you assigned to me.",
            "When is the next team meeting scheduled?",
            "I had some questions about the new requirements.",
            "Just sent you an email with important details.",
            "Are you joining the conference call tomorrow?",
            "I think we need to discuss the project timeline.",
            "Great work on that presentation!",
        ];
        
        // For each user, create some direct messages with Eva
        foreach ($otherUsers as $user) {
            // Create 5-10 messages
            $messageCount = rand(5, 10);
            
            // Base timestamp for ordering messages (3-7 days ago)
            $baseTimestamp = Carbon::now()->subDays(rand(3, 7));
            
            for ($i = 0; $i < $messageCount; $i++) {
                // Pick a random message
                $message = $sampleMessages[array_rand($sampleMessages)];
                
                // Randomly decide sender and receiver
                $isSenderEva = (bool) rand(0, 1);
                $sender = $isSenderEva ? $eva : $user;
                $receiver = $isSenderEva ? $user : $eva;
                
                // Add some time progression (15-120 minutes)
                $baseTimestamp = $baseTimestamp->addMinutes(rand(15, 120));
                
                // Create message
                DirectMessage::create([
                    'sender_id' => $sender->id,
                    'receiver_id' => $receiver->id,
                    'message' => $message,
                    'read' => rand(0, 3) > 0, // 75% chance of being read
                    'created_at' => $baseTimestamp,
                    'updated_at' => $baseTimestamp,
                ]);
            }
        }
    }
} 