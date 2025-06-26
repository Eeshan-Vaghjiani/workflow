<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class PromoteToAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:promote {email : The email of the user to promote to admin}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Promote an existing user to admin';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');

        // Find the user
        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email {$email} not found.");
            return 1;
        }

        if ($user->is_admin) {
            $this->info("User {$email} is already an admin.");
            return 0;
        }

        // Promote to admin
        $user->is_admin = true;
        $user->save();

        $this->info("User {$email} has been promoted to admin successfully!");
        $this->table(
            ['ID', 'Name', 'Email', 'Admin'],
            [[$user->id, $user->name, $user->email, 'Yes']]
        );

        return 0;
    }
}
