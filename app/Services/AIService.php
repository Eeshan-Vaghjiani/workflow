<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIService
{
    protected $apiKey;
    protected $baseUrl;
    protected $model;
    protected $verifySSL;

    public function __construct()
    {
        $this->apiKey = env('OPENROUTER_API_KEY', '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');
        $this->baseUrl = 'https://openrouter.ai/api/v1';
        $this->model = 'meta-llama/llama-4-scout:free';
        $this->verifySSL = env('OPENROUTER_VERIFY_SSL', false);
    }

    /**
     * Process a natural language prompt to create assignment tasks
     *
     * @param string $prompt The user's prompt describing tasks to create
     * @param int $userId The ID of the user making the request
     * @param int $groupId The ID of the group for which tasks are being created
     * @return array Structured data for creating tasks
     */
    public function processTaskPrompt(string $prompt, int $userId, int $groupId): array
    {
        try {
            // Get group members to help AI distribute tasks
            $groupMembers = [];
            try {
                $group = \App\Models\Group::with('members')->find($groupId);
                if ($group && $group->members->count() > 0) {
                    foreach ($group->members as $member) {
                        $groupMembers[] = $member->name;
                    }
                }
            } catch (\Exception $e) {
                // If there's an error getting group members, continue without them
                \Illuminate\Support\Facades\Log::warning('Could not get group members: ' . $e->getMessage());
            }
            
            $http = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
                'HTTP-Referer' => config('app.url', 'http://localhost'),
                'X-Title' => 'Workflow Task Manager'
            ]);
            
            if (!$this->verifySSL) {
                $http = $http->withoutVerifying();
            }
            
            // Create system message with group members if available
            $systemMessage = "You are a helpful assistant that helps structure assignment tasks. 
            When the user describes assignment tasks they want to create, extract the following information:
            1. The title of the assignment
            2. The unit name for the assignment (course code or subject name)
            3. The description of the assignment
            4. The individual tasks within the assignment";
            
            if (!empty($groupMembers)) {
                $systemMessage .= "\n\nThe following group members are available to be assigned tasks. Please distribute tasks evenly among them:
                " . implode(", ", $groupMembers);
            }
            
            $systemMessage .= "\n\nFor each task, specify:
            1. Who each task is assigned to (choose from the available members)
            2. The start date for each task
            3. The end date for each task
            4. The priority level of each task (low, medium, high)
            
            Respond with structured JSON data only. Follow this format:
            {
                \"assignment\": {
                    \"title\": \"Assignment Title\",
                    \"unit_name\": \"Course Code or Subject\",
                    \"description\": \"Assignment Description\",
                    \"start_date\": \"YYYY-MM-DD\", 
                    \"end_date\": \"YYYY-MM-DD\",
                    \"due_date\": \"YYYY-MM-DD\",
                    \"priority\": \"medium\"
                },
                \"tasks\": [
                    {
                        \"title\": \"Task 1 Title\",
                        \"description\": \"Task 1 Description\",
                        \"assigned_to_name\": \"Full Name\", 
                        \"start_date\": \"YYYY-MM-DD\",
                        \"end_date\": \"YYYY-MM-DD\",
                        \"priority\": \"medium\"
                    }
                ]
            }";
            
            $response = $http->post($this->baseUrl . '/chat/completions', [
                'model' => $this->model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => $systemMessage
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'temperature' => 0.3,
                'max_tokens' => 2500, // Increased token limit to handle larger prompts
                'response_format' => ['type' => 'json_object']
            ]);

            if ($response->failed()) {
                Log::error('OpenRouter API request failed', [
                    'status' => $response->status(), 
                    'reason' => $response->reason(),
                    'body' => $response->body()
                ]);
                return [
                    'error' => 'OpenRouter API request failed: ' . $response->status() . ' ' . $response->reason(),
                    'details' => $response->body()
                ];
            }
            
            $data = $response->json();
            
            Log::info('OpenRouter API response', ['response' => $data]);
            
            if (!isset($data['choices'][0]['message']['content'])) {
                Log::error('Invalid AI response', ['response' => $data]);
                return ['error' => 'Invalid AI response: ' . json_encode($data)];
            }
            
            $content = json_decode($data['choices'][0]['message']['content'], true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Failed to parse AI response', ['content' => $data['choices'][0]['message']['content']]);
                return ['error' => 'Failed to parse AI response: ' . json_last_error_msg()];
            }
            
            return $content;
        } catch (\Exception $e) {
            Log::error('Error calling AI service', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'api_key_length' => strlen($this->apiKey),
                'api_key_first_chars' => substr($this->apiKey, 0, 10) . '...',
                'base_url' => $this->baseUrl
            ]);
            return [
                'error' => 'Error processing request: ' . $e->getMessage(),
                'debug' => [
                    'model' => $this->model,
                    'api_key_set' => !empty($this->apiKey),
                    'base_url' => $this->baseUrl,
                    'verify_ssl' => $this->verifySSL,
                ]
            ];
        }
    }
} 