<?php

namespace App\Console\Commands;

use App\Models\GoogleCalendar;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class VerifyGoogleTokens extends Command
{
    protected $signature = 'google:verify-tokens {user_id?}';
    protected $description = 'Verify and debug Google OAuth tokens';

    public function handle()
    {
        $userId = $this->argument('user_id');
        
        if ($userId) {
            // Check specific user
            $user = User::find($userId);
            if (!$user) {
                $this->error("User with ID {$userId} not found");
                return 1;
            }
            
            $this->verifyUserTokens($user);
        } else {
            // Check all users with Google Calendar connections
            $connections = GoogleCalendar::with('user')->get();
            
            if ($connections->isEmpty()) {
                $this->info("No Google Calendar connections found");
                return 0;
            }
            
            foreach ($connections as $connection) {
                $this->verifyUserTokens($connection->user, $connection);
            }
        }
        
        return 0;
    }
    
    private function verifyUserTokens(User $user, ?GoogleCalendar $connection = null)
    {
        $this->info("Checking user: {$user->name} (ID: {$user->id})");
        
        if (!$connection) {
            $connection = GoogleCalendar::where('user_id', $user->id)->first();
        }
        
        if (!$connection) {
            $this->warn("  No Google Calendar connection found");
            return;
        }
        
        $this->info("  Calendar ID: {$connection->calendar_id}");
        $this->info("  Token expires at: " . ($connection->token_expires_at ? $connection->token_expires_at->format('Y-m-d H:i:s') : 'N/A'));
        
        // Check if access token exists
        if (empty($connection->access_token)) {
            $this->error("  Access token is empty");
            return;
        }
        
        $this->info("  Access token: " . substr($connection->access_token, 0, 10) . '...');
        
        // Check if refresh token exists
        if (empty($connection->refresh_token)) {
            $this->error("  Refresh token is empty");
        } else {
            $this->info("  Refresh token: " . substr($connection->refresh_token, 0, 10) . '...');
        }
        
        // Test the token with a real API call
        $this->info("  Testing token with API call...");
        
        try {
            $response = Http::withoutVerifying()->withToken($connection->access_token)
                ->get("https://www.googleapis.com/calendar/v3/calendars/{$connection->calendar_id}/events", [
                    'maxResults' => 1,
                ]);
            
            if ($response->successful()) {
                $this->info("  ✅ Token is working");
            } else {
                $this->error("  ❌ Token test failed: " . $response->status() . ' - ' . $response->body());
                
                // Try refreshing the token
                $this->info("  Attempting to refresh token...");
                
                try {
                    $refreshResponse = Http::withoutVerifying()->post('https://oauth2.googleapis.com/token', [
                        'client_id' => config('services.google.client_id'),
                        'client_secret' => config('services.google.client_secret'),
                        'refresh_token' => $connection->refresh_token,
                        'grant_type' => 'refresh_token',
                    ]);
                    
                    if ($refreshResponse->successful()) {
                        $data = $refreshResponse->json();
                        $connection->access_token = $data['access_token'];
                        $connection->token_expires_at = now()->addSeconds($data['expires_in']);
                        $connection->save();
                        
                        $this->info("  ✅ Token refreshed successfully");
                    } else {
                        $this->error("  ❌ Token refresh failed: " . $refreshResponse->status() . ' - ' . $refreshResponse->body());
                    }
                } catch (\Exception $e) {
                    $this->error("  ❌ Exception during token refresh: " . $e->getMessage());
                }
            }
        } catch (\Exception $e) {
            $this->error("  ❌ Exception during API call: " . $e->getMessage());
        }
    }
} 