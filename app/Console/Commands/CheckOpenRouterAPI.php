<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Services\AIService;

class CheckOpenRouterAPI extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'openrouter:check {--key= : Optional API key to test} {--fix : Try to update .env with a working API key}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check OpenRouter API configuration and fix issues';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('OpenRouter API Configuration Check');
        $this->line('================================');

        // Get API key from environment or command line
        $apiKey = $this->option('key') ?: env('OPENROUTER_API_KEY');

        if (empty($apiKey)) {
            $this->error('No API key found. Please set OPENROUTER_API_KEY in your .env file or provide --key option.');

            if ($this->option('fix')) {
                $this->fixApiKey();
            }

            return 1;
        }

        $this->info("API Key: " . substr($apiKey, 0, 10) . '...' . substr($apiKey, -4));

        // Check the API
        $this->line("\nTesting API connectivity...");

        // Use the AIService to test the connection
        $aiService = app(AIService::class);
        $result = $aiService->testConnection();

        if ($result['success']) {
            $this->info('✓ OpenRouter API is working properly!');
            $this->line('Response: ' . $result['response']);
            return 0;
        } else {
            $this->error('✗ OpenRouter API test failed: ' . $result['error']);

            if ($this->option('fix')) {
                $this->fixApiKey();
            } else {
                $this->line("\nSuggestions:");
                $this->line("1. Check that your OpenRouter API key is valid and active");
                $this->line("2. Sign up for a free API key at https://openrouter.ai");
                $this->line("3. Run this command with --fix to update your .env file with a working key");
                $this->line("4. Run 'php artisan config:clear' after updating your .env file");
            }

            return 1;
        }
    }

    /**
     * Attempts to fix the API key by updating the .env file
     */
    protected function fixApiKey()
    {
        $this->info("\nAttempting to fix API key configuration...");

        $envPath = base_path('.env');

        if (!file_exists($envPath)) {
            $this->error("No .env file found at: $envPath");
            return false;
        }

        // Ask for a new API key
        $this->line("You'll need to sign up for an OpenRouter API key at https://openrouter.ai");
        $newKey = $this->ask('Enter your OpenRouter API key');

        if (empty($newKey)) {
            $this->error("No API key provided. Please sign up for a key at https://openrouter.ai");
            return false;
        }

        // Read the current .env file
        $envContent = file_get_contents($envPath);

        // Check if OPENROUTER_API_KEY already exists in the file
        if (preg_match('/^OPENROUTER_API_KEY=.*/m', $envContent)) {
            // Replace the existing key
            $envContent = preg_replace('/^OPENROUTER_API_KEY=.*/m', "OPENROUTER_API_KEY=$newKey", $envContent);
            $this->info('Replacing existing OpenRouter API key in .env file.');
                } else {
            // Add the key if it doesn't exist
            $envContent .= "\nOPENROUTER_API_KEY=$newKey\n";
            $this->info('Adding OpenRouter API key to .env file.');
        }

        // Write the updated content back to the .env file
        if (file_put_contents($envPath, $envContent)) {
            $this->info('✓ Successfully updated .env file with new API key.');
            $this->line("\nImportant: You need to run 'php artisan config:clear' for the changes to take effect.");

            if ($this->confirm('Clear config cache now?', true)) {
                $this->call('config:clear');
                $this->info('Configuration cache cleared.');
            }

            return true;
        } else {
            $this->error('Failed to update .env file. Check file permissions and try again.');
            return false;
        }
    }
}
