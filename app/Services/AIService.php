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
<<<<<<< HEAD
        $this->apiKey = env('OPENROUTER_API_KEY');

        if (empty($this->apiKey)) {
            Log::warning('OpenRouter API key not set. Service will not function properly.');
        }

=======
        // Get the API key from .env, with a fallback to a free demo key if not set
        // Note: Using the demo key has limited requests per month
        $this->apiKey = env('OPENROUTER_API_KEY', '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');
>>>>>>> fc504d1 (AI)
        $this->baseUrl = 'https://openrouter.ai/api/v1';
<<<<<<< HEAD
        $this->model = env('OPENROUTER_MODEL', 'qwen/qwen3-4b:free');
=======
        $this->model = env('OPENROUTER_MODEL', 'mistralai/mistral-7b-instruct');
>>>>>>> b6b9110134e8f0ffe5538dc4515ca8223723822f
        $this->verifySSL = env('OPENROUTER_VERIFY_SSL', false);

<<<<<<< HEAD
        // Log initialization (without exposing API key)
=======
        // Log API Key information (masked for security)
        $keyLength = strlen($this->apiKey);
        $maskedKey = substr($this->apiKey, 0, 10) . str_repeat('*', $keyLength - 14) . substr($this->apiKey, -4);
>>>>>>> fc504d1 (AI)
        Log::info('AIService initialized', [
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

<<<<<<< HEAD
=======
            // Create system message with group members if available
>>>>>>> fc504d1 (AI)
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
<<<<<<< HEAD
            - Effort hours (estimated time needed to complete the task, from 1-20 hours)
            - Importance (scale of 1-5, where 5 is most important)
=======
>>>>>>> fc504d1 (AI)

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

<<<<<<< HEAD
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

=======
            Always use the YYYY-MM-DD format for dates. Your ENTIRE response must be parseable as JSON.";

            // Log request parameters
>>>>>>> fc504d1 (AI)
            Log::info('Making OpenRouter API request', [
                'model' => $this->model,
                'system_message_length' => strlen($systemMessage),
                'prompt_length' => strlen($prompt),
            ]);

<<<<<<< HEAD
=======
            // Make the API request
>>>>>>> fc504d1 (AI)
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

<<<<<<< HEAD
=======
            // Try to extract JSON content if it's wrapped in markdown code blocks
>>>>>>> fc504d1 (AI)
            if (preg_match('/```(?:json)?(.*?)```/s', $rawContent, $matches)) {
                $jsonContent = trim($matches[1]);
                Log::info('Extracted JSON from code block', ['extracted' => $jsonContent]);
            } else {
                $jsonContent = $rawContent;
            }

<<<<<<< HEAD
=======
            // Use robust JSON parser instead of simple json_decode
>>>>>>> fc504d1 (AI)
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

<<<<<<< HEAD
=======
    /**
     * Test the OpenRouter API connection
     *
     * @return array Connection status information
     */
>>>>>>> fc504d1 (AI)
    public function testConnection(): array
    {
        try {
            $http = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
                'HTTP-Referer' => config('app.url', 'http://localhost'),
<<<<<<< HEAD
            ]);

            if (!$this->verifySSL) {
                $http = $http->withoutVerifying();
            }

=======
            ])->withoutVerifying();

            // First test: get models list
>>>>>>> fc504d1 (AI)
            $modelsResponse = $http->get($this->baseUrl . '/models');

            if ($modelsResponse->failed()) {
                return [
                    'success' => false,
                    'error' => 'Failed to retrieve models: ' . $modelsResponse->status() . ' ' . $modelsResponse->reason(),
                    'response' => $modelsResponse->body()
                ];
            }

<<<<<<< HEAD
=======
            // Simple test message
            $chatResponse = $http->post($this->baseUrl . '/chat/completions', [
                'model' => $this->model,
                'messages' => [
                    ['role' => 'user', 'content' => 'Say "The OpenRouter API is working!"']
                ],
                'max_tokens' => 50
            ]);

            if ($chatResponse->failed()) {
                return [
                    'success' => false,
                    'error' => 'Chat test failed: ' . $chatResponse->status() . ' ' . $chatResponse->reason(),
                    'response' => $chatResponse->body()
                ];
            }

            $data = $chatResponse->json();

            if (!isset($data['choices'][0]['message']['content'])) {
                return [
                    'success' => false,
                    'error' => 'Missing content in response',
                    'response' => $data
                ];
            }

>>>>>>> fc504d1 (AI)
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
<<<<<<< HEAD
        $cleaned = trim($json);
=======
        // Replace Unicode quotes with regular quotes
        $json = str_replace(["\u201C", "\u201D", "\u201E", "\u2018", "\u2019"], '"', $json);

        // Remove BOM and non-breaking spaces
        $json = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $json);

        // Fix trailing commas in arrays and objects (common issue with AI-generated JSON)
        $json = preg_replace('/,\s*([\]}])/m', '$1', $json);

        // Remove comments
        $json = preg_replace('!/\*.*?\*/!s', '', $json);
        $json = preg_replace('!//.*?$!m', '', $json);

        // Try to fix unescaped quotes in values (risky, but can help)
        $json = preg_replace('/"([^"]*)":\s*"([^"]*)"([^"]*)"/', '"$1": "$2\\"$3"', $json);

        // Log the cleaned JSON
        Log::info('Cleaned JSON string', ['original_length' => strlen($json), 'cleaned' => $json]);

        return $json;
    }

    /**
     * Robust JSON decoder that tries multiple approaches for parsing
     * AI-generated JSON that may have formatting issues
     *
     * @param string $jsonString The JSON string to parse
     * @return array|null The decoded JSON or null if parsing fails
     */
    private function robustJsonDecode(string $jsonString): ?array
    {
        // First try simple decode
        $decoded = json_decode($jsonString, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $decoded;
        }

        // Clean the string and try again
        $cleaned = $this->cleanJsonString($jsonString);
>>>>>>> fc504d1 (AI)
        $decoded = json_decode($cleaned, true);

        if (json_last_error() === JSON_ERROR_NONE) {
            return $decoded;
        }

<<<<<<< HEAD
        // Try fallback decoding methods if needed
=======
        // More aggressive approach - extract anything that looks like JSON
        if (preg_match('/(\{.*\})/s', $jsonString, $matches)) {
            $extracted = $matches[1];
            Log::info('Extracted JSON object', ['extracted' => $extracted]);

            $decoded = json_decode($extracted, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $decoded;
            }

            // Try cleaning the extracted portion
            $cleanedExtract = $this->cleanJsonString($extracted);
            $decoded = json_decode($cleanedExtract, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $decoded;
            }
        }

        // Last resort - try to fix specific syntax errors
        try {
            // Use built-in PHP parser to identify potential syntax errors
            $tempFile = tempnam(sys_get_temp_dir(), 'json_');
            file_put_contents($tempFile, '<?php $json = ' . var_export($cleaned, true) . ';');
            include $tempFile;
            unlink($tempFile);

            // If we got here without a parse error, try to manually build a structure
            if (isset($json) && is_string($json)) {
                // Extract all key-value pairs using regex
                preg_match_all('/"([^"]+)"\s*:\s*"([^"]+)"/', $json, $matches, PREG_SET_ORDER);

                $result = ['assignment' => [], 'tasks' => []];
                foreach ($matches as $match) {
                    $key = $match[1];
                    $value = $match[2];

                    // Determine where this pair belongs
                    if (in_array($key, ['title', 'unit_name', 'description', 'due_date'])) {
                        $result['assignment'][$key] = $value;
                    } else {
                        // This is likely a task property
                        // We can't easily reconstruct the full task structure here
                        // This is a simplification
                        $result['tasks'][0][$key] = $value;
                    }
                }

                return $result;
            }
        } catch (\Throwable $e) {
            Log::error('Exception in robust JSON parsing', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }

        // If we get here, all parsing attempts failed
>>>>>>> fc504d1 (AI)
        return null;
    }
}
