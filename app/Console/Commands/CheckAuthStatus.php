<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Laravel\Sanctum\PersonalAccessToken;

class CheckAuthStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'auth:status {email?} {--token= : The token to check}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check authentication status and configuration';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Authentication Status Check');
        $this->line('==========================');
        
        // Check Laravel Sanctum configuration
        $this->info('Sanctum Configuration:');
        $this->line('- Stateful domains: ' . implode(', ', config('sanctum.stateful', ['none'])));
        $this->line('- Token expiration: ' . (config('sanctum.expiration') ? config('sanctum.expiration') . ' minutes' : 'Never'));
        
        // Check if we have a specific user to check
        $email = $this->argument('email');
        if ($email) {
            $user = User::where('email', $email)->first();
            
            if (!$user) {
                $this->error("No user found with email: $email");
                return 1;
            }

            $this->info("\nUser Information:");
            $this->table(['ID', 'Name', 'Email'], [[$user->id, $user->name, $user->email]]);
            
            // Show tokens for the user
            $tokens = $user->tokens;
            
            if ($tokens->isEmpty()) {
                $this->warn("No tokens found for this user");
            } else {
                $tokenData = $tokens->map(function ($token) {
                    return [
                        $token->id,
                        $token->name,
                        $token->created_at->format('Y-m-d H:i:s'),
                        $token->abilities ? implode(', ', $token->abilities) : 'all',
                        $token->last_used_at ? $token->last_used_at->format('Y-m-d H:i:s') : 'never'
                    ];
                });
                
                $this->info("\nUser Tokens:");
                $this->table(
                    ['ID', 'Name', 'Created At', 'Abilities', 'Last Used'],
                    $tokenData->toArray()
                );
            }
        }
        
        // Check a specific token
        $tokenString = $this->option('token');
        if ($tokenString) {
            $this->info("\nChecking token: $tokenString");
            
            // Extract token and prefix
            $tokenParts = explode('|', $tokenString);
            if (count($tokenParts) !== 2) {
                $this->error("Invalid token format. Expected format: [id]|[token_hash]");
                return 1;
            }
            
            $id = $tokenParts[0];
            $token = PersonalAccessToken::find($id);
            
            if (!$token) {
                $this->error("No token found with ID: $id");
                return 1;
            }
            
            $this->info("Token found:");
            $this->table(
                ['ID', 'Name', 'User ID', 'Created At', 'Last Used'],
                [[$token->id, $token->name, $token->tokenable_id, $token->created_at, $token->last_used_at]]
            );
        }
        
        // Show session configuration
        $this->info("\nSession Configuration:");
        $this->line('- Driver: ' . config('session.driver', 'file'));
        $this->line('- Lifetime: ' . config('session.lifetime', 120) . ' minutes');
        $this->line('- Cookie: ' . config('session.cookie', 'laravel_session'));
        $this->line('- Path: ' . config('session.path', '/'));
        $this->line('- Domain: ' . config('session.domain', null) ?: 'null');
        $this->line('- Secure: ' . (config('session.secure') ? 'Yes' : 'No'));
        $this->line('- HTTP Only: ' . (config('session.http_only') ? 'Yes' : 'No'));
        $this->line('- Same Site: ' . (config('session.same_site') ?: 'null'));
        
        return 0;
    }
} 