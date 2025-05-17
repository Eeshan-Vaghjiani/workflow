<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class CheckOpenRouterAPI extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'openrouter:check {--key= : Optional API key to test}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check OpenRouter API configuration';

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
            return 1;
        }
        
        $this->info("API Key: " . substr($apiKey, 0, 10) . '...' . substr($apiKey, -4));
        
        // Check the API
        $this->line("\nTesting API connectivity...");
        
        try {
            // First, try to get the models list
            $response = Http::withoutVerifying()->withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'HTTP-Referer' => config('app.url') ?: 'http://localhost',
            ])->get('https://openrouter.ai/api/v1/models');
            
            if ($response->successful()) {
                $models = $response->json();
                $this->info('✓ Successfully connected to OpenRouter API');
                
                // Check if our model exists
                $targetModel = 'meta-llama/llama-4-scout:free';
                $modelFound = false;
                
                $this->line("\nAvailable models:");
                $modelData = collect($models['data'] ?? []);
                
                // Filter to just the relevant model families
                $relevantModels = $modelData->filter(function($model) {
                    return str_contains($model['id'] ?? '', 'llama') ||
                           str_contains($model['id'] ?? '', 'scout');
                });
                
                if ($relevantModels->isEmpty()) {
                    $relevantModels = $modelData->take(5); // At least show some models if none match
                }
                
                // Format and display models
                $formattedModels = $relevantModels->map(function($model) use (&$modelFound, $targetModel) {
                    $isTarget = $model['id'] === $targetModel;
                    if ($isTarget) $modelFound = true;
                    
                    return [
                        $model['id'],
                        $model['name'] ?? 'N/A',
                        $model['context_length'] ?? 'N/A',
                        $isTarget ? '✓ (TARGET)' : ''
                    ];
                })->toArray();
                
                $this->table(
                    ['ID', 'Name', 'Context Length', 'Status'],
                    $formattedModels
                );
                
                if (!$modelFound) {
                    $this->warn("⚠ Target model '$targetModel' not found in available models!");
                    $this->line("You may need to update your model name in AIService.php");
                } else {
                    $this->info("✓ Target model '$targetModel' is available");
                }
                
                // Try a simple chat completion
                $this->line("\nTesting chat completion...");
                
                $chatResponse = Http::withoutVerifying()->withHeaders([
                    'Authorization' => 'Bearer ' . $apiKey,
                    'HTTP-Referer' => config('app.url') ?: 'http://localhost',
                    'Content-Type' => 'application/json'
                ])->post('https://openrouter.ai/api/v1/chat/completions', [
                    'model' => 'meta-llama/llama-4-scout:free',
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are a helpful assistant.'
                        ],
                        [
                            'role' => 'user',
                            'content' => 'Hello world! Please respond with a simple greeting.'
                        ]
                    ],
                    'max_tokens' => 50
                ]);
                
                if ($chatResponse->successful()) {
                    $this->info("✓ Chat completion test successful!");
                    $text = $chatResponse->json()['choices'][0]['message']['content'] ?? 'No content';
                    $this->line("Response: " . $text);
                } else {
                    $this->error("✗ Chat completion test failed");
                    $this->line("Status: " . $chatResponse->status());
                    $this->line("Response: " . $chatResponse->body());
                }
            } else {
                $this->error('✗ Failed to connect to OpenRouter API');
                $this->line("Status: " . $response->status());
                $this->line("Response: " . $response->body());
            }
        } catch (\Exception $e) {
            $this->error('✗ Error testing OpenRouter API: ' . $e->getMessage());
        }
        
        return 0;
    }
} 