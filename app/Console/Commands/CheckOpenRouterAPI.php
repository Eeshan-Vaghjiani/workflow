<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
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
    protected $description = 'Check OpenRouter API connection and key validity';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking OpenRouter API connection...');

        $apiKey = env('OPENROUTER_API_KEY');

        if (empty($apiKey)) {
            $this->error('OpenRouter API key is not set in .env file');
            return 1;
        }

        $this->info('API Key found in .env (first 10 chars): ' . substr($apiKey, 0, 10) . '...');

        try {
            $http = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
                'HTTP-Referer' => config('app.url', 'http://localhost'),
            ])->withoutVerifying();

            $this->info('Testing models endpoint...');
            $modelsResponse = $http->get('https://openrouter.ai/api/v1/models');

            // Log the raw response for debugging
            Log::info('OpenRouter models response', [
                'status' => $modelsResponse->status(),
                'body' => $modelsResponse->body()
            ]);

            if ($modelsResponse->successful()) {
                $this->info('✅ Successfully connected to OpenRouter API');
                $this->info('Available models:');

                $models = $modelsResponse->json('data', []);
                foreach ($models as $model) {
                    $this->line(' - ' . $model['id'] . ' (' . ($model['pricing']['prompt'] ?? 'N/A') . ' per prompt token)');
                }

                // Test a simple completion to verify full API functionality
                $this->info("\nTesting a simple completion...");

                $completionResponse = $http->post('https://openrouter.ai/api/v1/chat/completions', [
                    'model' => 'meta-llama/llama-3-8b-instruct',
                    'messages' => [
                        ['role' => 'user', 'content' => 'Say hello in one word.']
                    ],
                    'max_tokens' => 10
                ]);

                // Log the raw completion response
                Log::info('OpenRouter completion test response', [
                    'status' => $completionResponse->status(),
                    'body' => $completionResponse->body()
                ]);

                if ($completionResponse->successful()) {
                    $content = $completionResponse->json('choices.0.message.content', 'No content returned');
                    $this->info('✅ Completion test successful');
                    $this->info('Response: ' . $content);

                    return 0;
                } else {
                    $this->error('❌ Completion test failed with status code: ' . $completionResponse->status());
                    $this->error('Error: ' . $completionResponse->body());

                    return 1;
                }
            } else {
                $this->error('❌ Failed to connect to OpenRouter API');
                $this->error('Status code: ' . $modelsResponse->status());
                $this->error('Response: ' . $modelsResponse->body());

                return 1;
            }
        } catch (\Exception $e) {
            $this->error('❌ Exception occurred: ' . $e->getMessage());
            Log::error('OpenRouter API check exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

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
        $newKey = $this->ask('Enter your OpenRouter API key (or leave empty to use a free demo key with limited usage)');

        if (empty($newKey)) {
            $newKey = 'sk-or-free-01-f17ayy59lzk17qlzx7g7noceei6qztya2qgj382lsen36jo06r';
            $this->warn("Using free demo key with limited usage!");
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