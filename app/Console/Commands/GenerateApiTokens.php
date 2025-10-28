<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class GenerateApiTokens extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'api:generate-tokens {--force : Force regenerate tokens for users who already have one}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate API tokens for all users or specific users';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $force = $this->option('force');
        
        $query = User::query();
        
        if (!$force) {
            $query->whereNull('api_token');
            $this->info('Generating tokens only for users without existing tokens.');
        } else {
            $this->info('Regenerating tokens for all users (force mode).');
        }
        
        $users = $query->get();
        $count = $users->count();
        
        if ($count === 0) {
            $this->info('No users found that need tokens.');
            return 0;
        }
        
        $this->info("Generating API tokens for {$count} users...");
        $bar = $this->output->createProgressBar($count);
        $bar->start();
        
        foreach ($users as $user) {
            $user->api_token = hash('sha256', Str::random(60));
            $user->save();
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine();
        $this->info('API tokens generated successfully!');
        
        return 0;
    }
}
