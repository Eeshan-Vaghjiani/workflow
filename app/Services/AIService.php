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
        // Get the API key from .env, with a fallback to a free demo key if not set
        // Note: Using the demo key has limited requests per month
        $this->apiKey = env('OPENROUTER_API_KEY', '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');
        $this->baseUrl = 'https://openrouter.ai/api/v1';
        $this->model = env('OPENROUTER_MODEL', 'mistralai/mistral-7b-instruct');
        $this->verifySSL = env('OPENROUTER_VERIFY_SSL', false);

        // Log API Key information (masked for security)
        $keyLength = strlen($this->apiKey);
        $maskedKey = substr($this->apiKey, 0, 10) . str_repeat('*', $keyLength - 14) . substr($this->apiKey, -4);
        Log::info('AIService initialized', [
            'key_length' => $keyLength,
            'masked_key' => $maskedKey,
            'model' => $this->model,
            'verify_ssl' => $this->verifySSL ? 'true' : 'false',
        ]);
    }

    public function processTaskPrompt(string $prompt, int $userId, int $groupId): array
    {
        try {
            $groupMembers = [];
            try {
                $group = \App\Models\Group::with('members')->find($groupId);
                if ($group && $group->members->count() > 0) {
                    foreach ($group->members as $member) {
                        $groupMembers[] = $member->name;
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Could not get group members: ' . $e->getMessage());
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

            $systemMessage = "You are a helpful assistant specialized in creating structured task assignments. Your ONLY job is to return valid, parseable JSON.
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
            - Title (short but descriptive)
            - Description (more details)
            - Who it is assigned to (choose from the available group members)
            - Start date (relative to now)
            - End date (absolute date or relative to start date)
            - Priority (low, medium, or high)
            - Effort hours (estimated time needed to complete the task, from 1-20 hours)
            - Importance (scale of 1-5, where 5 is most important)

            CRITICAL: Your entire response must ONLY be valid JSON with no additional text before or after. DO NOT include markdown backticks, explanations, or any other text.

            The JSON structure must be:
            {
                \"assignment\": {
                    \"title\": \"Assignment title\",
                    \"unit_name\": \"Unit or course name\",
                    \"description\": \"Assignment description\",
                    \"due_date\": \"YYYY-MM-DD\"
                },
                \"tasks\": [
                    {
                        \"title\": \"Task 1 title\",
                        \"description\": \"Task 1 description\",
                        \"assigned_to_name\": \"Person's Name\",
                        \"start_date\": \"YYYY-MM-DD\",
                        \"end_date\": \"YYYY-MM-DD\",
                        \"priority\": \"medium\",
                        \"effort_hours\": 3,
                        \"importance\": 4
                    }
                ]
            }

            When determining effort hours and importance, consider:
            - Effort hours: Realistic estimate of how many hours it would take to complete the task (1-20)
              - Simple tasks: 1-3 hours
              - Medium tasks: 4-8 hours
              - Complex tasks: 9-20 hours

            - Importance: How critical the task is to the overall assignment success
              - 5: Critical path task, project cannot succeed without it
              - 4: Very important task with major impact
              - 3: Standard task with moderate impact
              - 2: Supporting task with minor impact
              - 1: Nice-to-have task with minimal impact

            - When assigning tasks, consider:
              1. Balancing workload by considering both effort AND importance
              2. Assigning related tasks to the same person when logical
              3. Each member should have a mix of high and low importance tasks

            Always use the YYYY-MM-DD format for dates. Your ENTIRE response must be parseable as JSON.";

            Log::info('Making OpenRouter API request', [
                'model' => $this->model,
                'system_message_length' => strlen($systemMessage),
                'prompt_length' => strlen($prompt),
            ]);

            $response = $http->post($this->baseUrl . '/chat/completions', [
                'model' => $this->model,
                'messages' => [
                    ['role' => 'system', 'content' => $systemMessage],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => 0.1,
                'response_format' => ["type" => "json_object"],
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

            Log::info('OpenRouter API response', [
                'status_code' => $response->status(),
                'headers' => $response->headers(),
                'data' => $data,
            ]);

            if (!isset($data['choices'][0]['message']['content'])) {
                Log::error('Invalid AI response', ['response' => $data]);
                return ['error' => 'Invalid AI response: ' . json_encode($data)];
            }

            $rawContent = $data['choices'][0]['message']['content'];
            Log::info('Raw AI content', ['content' => $rawContent]);

            if (preg_match('/```(?:json)?(.*?)```/s', $rawContent, $matches)) {
                $jsonContent = trim($matches[1]);
                Log::info('Extracted JSON from code block', ['extracted' => $jsonContent]);
            } else {
                $jsonContent = $rawContent;
            }

            $content = $this->robustJsonDecode($jsonContent);

            if ($content === null) {
                Log::error('All JSON parsing attempts failed', [
                    'raw_content' => $rawContent,
                    'json_content' => $jsonContent
                ]);
                return ['error' => 'Failed to parse AI response: Syntax error'];
            }

            return $content;
        } catch (\Exception $e) {
            Log::error('Exception in AI processing', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return [
                'error' => 'AI Service Error: ' . $e->getMessage(),
                'debug' => [
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]
            ];
        }
    }

    public function testConnection(): array
    {
        try {
            $http = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
                'HTTP-Referer' => config('app.url', 'http://localhost'),
            ]);

            if (!$this->verifySSL) {
                $http = $http->withoutVerifying();
            }

            $modelsResponse = $http->get($this->baseUrl . '/models');

            if ($modelsResponse->failed()) {
                return [
                    'success' => false,
                    'error' => 'Failed to retrieve models: ' . $modelsResponse->status() . ' ' . $modelsResponse->reason(),
                    'response' => $modelsResponse->body()
                ];
            }

            return [
                'success' => true,
                'models' => $modelsResponse->json()
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Test connection failed: ' . $e->getMessage()
            ];
        }
    }

    protected function robustJsonDecode(string $json)
    {
        $cleaned = trim($json);
        $decoded = json_decode($cleaned, true);

        if (json_last_error() === JSON_ERROR_NONE) {
            return $decoded;
        }

        // Try fallback decoding methods if needed
        return null;
    }
}
