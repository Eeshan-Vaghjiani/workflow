<?php

namespace App\Services;

use App\Models\AIPrompt;
use App\Models\ApiLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;

class AIService
{
    protected $apiKey;
    protected $baseUrl;
    protected $model;
    protected $verifySSL;
    protected $availableModels = [
        'qwen/qwen3-4b:free',
        'mistralai/mistral-7b-instruct',
        'openai/opus',
        'meta-llama/llama-3-8b-instruct',
        'anthropic/claude-3-haiku'
    ];
    protected $lastWorkingModel = null;

    public function __construct()
    {
        // Priority: Direct env variables, then config values
        $this->apiKey = env('OPENROUTER_API_KEY') ?: Config::get('openrouter.api_key');

        if (empty($this->apiKey) || $this->apiKey === 'sk-or-v1-1234567890abcdef1234567890abcdef') {
            Log::warning('OpenRouter API key not set. Service will not function properly.');
        }

        $this->baseUrl = 'https://openrouter.ai/api/v1';
        // Will be determined dynamically when needed
        $this->model = env('OPENROUTER_MODEL') ?: Config::get('openrouter.model', '');
        $this->verifySSL = env('OPENROUTER_VERIFY_SSL') !== null
            ? (bool)env('OPENROUTER_VERIFY_SSL')
            : Config::get('openrouter.verify_ssl', false);

        // Log initialization (without exposing API key)
        Log::info('AIService initialized', [
            'verify_ssl' => $this->verifySSL ? 'true' : 'false',
        ]);
    }

    /**
     * Get a working model from available free models
     */
    public function getWorkingModel()
    {
        // If we already found a working model in this session, return it
        if ($this->lastWorkingModel) {
            Log::info('Using previously working model: ' . $this->lastWorkingModel);
            return $this->lastWorkingModel;
        }

        // If model is already set from environment and not empty, try that first
        if (!empty($this->model)) {
            // Verify if this model exists in our preferred models
            if (in_array($this->model, $this->availableModels)) {
                Log::info('Using model from environment: ' . $this->model);
                $this->lastWorkingModel = $this->model;
                return $this->model;
            }
        }

        // Check available models from OpenRouter
        try {
            $http = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ]);

            if (!$this->verifySSL) {
                $http = $http->withoutVerifying();
            }

            $response = $http->get($this->baseUrl . '/models');

            if ($response->successful()) {
                $models = $response->json('data', []);
                $availableModelIds = collect($models)->pluck('id')->toArray();

                Log::info('Available models from OpenRouter: ' . implode(', ', $availableModelIds));

                // Find the first model from our list that's available
                foreach ($this->availableModels as $modelId) {
                    if (in_array($modelId, $availableModelIds)) {
                        Log::info('Found working model: ' . $modelId);
                        $this->lastWorkingModel = $modelId;
                        return $modelId;
                    }
                }
            } else {
                Log::error('Error fetching available models: ' . $response->status());
            }
        } catch (\Exception $e) {
            Log::error('Error checking available models: ' . $e->getMessage());
        }

        // Fallback to a default model if none available
        $fallbackModel = $this->availableModels[0];
        Log::info('Falling back to default model: ' . $fallbackModel);
        $this->lastWorkingModel = $fallbackModel;
        return $fallbackModel;
    }

    public function processTaskPrompt(string $prompt, int $userId, int $groupId): array
    {
        $startTime = microtime(true);
        $modelToUse = null;
        $response = null;
        $payload = [];

        try {
            // Check if API key is missing
            if (empty($this->apiKey) || $this->apiKey === 'sk-or-v1-1234567890abcdef1234567890abcdef') {
                Log::error('OpenRouter API key is missing');
                return [
                    'success' => false,
                    'error' => 'API configuration error: Please configure the OpenRouter API key.',
                    'debug' => [
                        'message' => 'OPENROUTER_API_KEY is not set or is using the default placeholder value'
                    ]
                ];
            }

            // Check if the user has prompts remaining
            $user = \App\Models\User::find($userId);
            if (!$user) {
                return [
                    'success' => false,
                    'error' => 'User not found',
                    'redirect_to_pricing' => false
                ];
            }

            // Use the PromptService to check and consume a prompt
            $promptService = app(\App\Services\PromptService::class);
            if (!$promptService->hasPromptsRemaining($user)) {
                return [
                    'success' => false,
                    'error' => 'You have no AI prompts remaining. Please purchase more to continue using AI services.',
                    'redirect_to_pricing' => true
                ];
            }

            // Start timing the response
            $startTime = microtime(true);

            $groupMembers = [];
            try {
                $group = \App\Models\Group::with('members')->find($groupId);
                if ($group && $group->members->count() > 0) {
                    foreach ($group->members as $member) {
                        $groupMembers[] = $member->name;
                    }
                }

                // DEBUG: Log team member data before prompt assembly
                Log::info('DEBUG: Team members being added to prompt:', [
                    'team_members' => json_encode($groupMembers, JSON_PRETTY_PRINT),
                    'count' => count($groupMembers),
                    'group_id' => $groupId
                ]);
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
            - Start date (relative to now, must not be in the past)
            - End date (absolute date or relative to start date, must be between start date and assignment due date)
            - Priority (low, medium, or high)
            - Effort hours (estimated time needed to complete the task, from 1-20 hours)
            - Importance (scale of 1-5, where 5 is most important)

            CRITICAL: Your entire response must ONLY be valid JSON with no additional text before or after. DO NOT include markdown backticks, explanations, or any other text.

            IMPORTANT DATE RULES:
            - Today's date is " . now()->format('Y-m-d') . "
            - All task start dates must be today or in the future, never in the past
            - All task end dates must be before or on the assignment due date
            - For simple tasks (1-3 effort hours), end dates should be within 1-3 days of start date

            - For medium tasks (4-8 effort hours), end dates should be within 3-7 days of start date

            - For complex tasks (9-20 effort hours), end dates should be within 7-14 days of start date


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

            $modelToUse = $this->getWorkingModel();

            $data = [
                'model' => $modelToUse,
                'system_message' => $systemMessage,
                'user_prompt' => $prompt,
            ];

            Log::info('DEBUG: Final prompt being sent to OpenRouter:', $data);

            Log::info('Making OpenRouter API request', [
                'model' => $modelToUse,
                'system_message_length' => strlen($systemMessage),
                'prompt_length' => strlen($prompt),
            ]);

            // Make API call to OpenRouter
            $payload = [
                'model' => $modelToUse,
                'messages' => [
                    ['role' => 'system', 'content' => $systemMessage],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'temperature' => 1,
                'response_format' => ["type" => "json_object"],
            ];

            $response = $http->post($this->baseUrl . '/chat/completions', $payload);

            Log::info('DEBUG: OpenRouter response status:', ['status' => $response->status()]);

            if ($response->successful()) {
                // Log raw response for debugging
                Log::info('DEBUG: Raw OpenRouter response body:', ['raw_response' => $response->body()]);

                // Get the content from the API response
                $content = $response->json('choices.0.message.content');

                if ($content === null) {
                    Log::error('OpenRouter API returned null content', [
                        'status' => $response->status(),
                        'body' => $response->body()
                    ]);
                    return [
                        'success' => false,
                        'error' => 'API returned invalid response format'
                    ];
                }

                Log::info('Raw AI content', ['content' => $content]);

                // Process into valid JSON
                $processedJson = $this->robustJsonDecode($content);

                if ($processedJson === null) {
                    // Consume prompt usage - we got a response even if it failed to parse
                    try {
                        $promptService->usePrompt($user, 'task_creation', 1);
                    } catch (\Exception $e) {
                        Log::error('Error in usePrompt: ' . $e->getMessage());
                    }

                    return [
                        'success' => false,
                        'error' => 'Could not process the AI response into valid JSON. Please try again.',
                        'raw_content' => $content
                    ];
                }

                // Consume prompt usage after successful processing
                try {
                    $promptService->usePrompt($user, 'task_creation', 1);
                } catch (\Exception $e) {
                    Log::error('Error in usePrompt: ' . $e->getMessage());
                    return [
                        'success' => false,
                        'error' => 'An error occurred while processing your request: ' . $e->getMessage()
                    ];
                }

                // Calculate time taken for the request
                $endTime = microtime(true);
                $timeTaken = $endTime - $startTime;

                return [
                    'success' => true,
                    'assignment' => $processedJson['assignment'] ?? null,
                    'tasks' => $processedJson['tasks'] ?? [],
                    'time_taken' => round($timeTaken, 2),
                    'model_used' => $modelToUse
                ];
            } else {
                Log::error('OpenRouter API error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);

                return [
                    'success' => false,
                    'error' => 'API call failed: ' . $response->status() . ' ' . $response->body()
                ];
            }
        } catch (\Exception $e) {
            Log::error('Error in processTaskPrompt: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'error' => 'An error occurred while processing your request: ' . $e->getMessage()
            ];
        } finally {
            ApiLog::create([
                'service' => 'OpenRouter',
                'model' => $modelToUse,
                'user_id' => $userId,
                'status_code' => $response ? $response->status() : 500,
                'response_time_ms' => (microtime(true) - $startTime) * 1000,
                'request_payload' => json_encode($payload),
                'response_payload' => $response ? $response->body() : null,
            ]);
        }
    }

    /**
     * Distribute tasks among group members based on effort and importance
     *
     * @param array $tasks Array of tasks with id, title, effort_hours, importance
     * @param array $groupMembers Array of group members with id, name
     * @return array Updated tasks with assigned_user_id
     */
    public function distributeTasks(array $tasks, array $groupMembers): array
    {
        try {
            // Filter out any null or invalid members
            $groupMembers = array_filter($groupMembers, function($member) {
                return isset($member['id']) && isset($member['name']) && $member['name'] !== null;
            });

            // If there are no tasks or group members, return tasks unchanged
            if (empty($tasks) || empty($groupMembers)) {
                Log::warning('Cannot distribute tasks: No tasks or valid group members provided', [
                    'task_count' => count($tasks),
                    'member_count' => count($groupMembers)
                ]);
                return $tasks;
            }

            // DEBUG: Log team members data before task distribution
            Log::info('DEBUG: Team members for task distribution:', [
                'members' => json_encode($groupMembers, JSON_PRETTY_PRINT),
                'count' => count($groupMembers)
            ]);

            $http = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
                'HTTP-Referer' => config('app.url', 'http://localhost'),
                'X-Title' => 'Workflow Task Manager'
            ]);

            if (!$this->verifySSL) {
                $http = $http->withoutVerifying();
            }

            // Prepare task data for AI processing
            $taskData = [];
            foreach ($tasks as $task) {
                if (!isset($task['id']) || !isset($task['title'])) {
                    continue; // Skip invalid tasks
                }

                $taskData[] = [
                    'id' => $task['id'],
                    'title' => $task['title'],
                    'effort_hours' => $task['effort_hours'] ?? 1,
                    'importance' => $task['importance'] ?? 3
                ];
            }

            // If we have no valid tasks, return original tasks
            if (empty($taskData)) {
                Log::warning('No valid tasks found for distribution');
                return $tasks;
            }

            // DEBUG: Log task data for distribution
            Log::info('DEBUG: Tasks for distribution:', [
                'tasks' => json_encode($taskData, JSON_PRETTY_PRINT),
                'count' => count($taskData)
            ]);

            // Prepare member data - ensure we only have valid members
            $memberData = [];
            foreach ($groupMembers as $member) {
                $memberData[] = [
                    'id' => $member['id'],
                    'name' => $member['name']
                ];
            }

            // Create system message for AI
            $systemMessage = "You are a task distribution AI. Your job is to optimally distribute tasks among team members based on effort hours and importance.

            IMPORTANT: You MUST return a valid JSON array of task assignments that ONLY contains the task ID and the assigned user ID. Nothing else.

            Distribute tasks evenly considering:
            1. Balance total effort hours among members
            2. Balance total importance points among members
            3. Consider both factors together (effort * importance) for fairness
            4. Return ONLY the task IDs and assigned user IDs

            The response format must be a JSON array like this:
            [
                {\"id\": 1, \"assigned_user_id\": 505},
                {\"id\": 2, \"assigned_user_id\": 506},
                {\"id\": 3, \"assigned_user_id\": 505}
            ]";

            // Prepare user message with task and member data
            $userMessage = json_encode([
                'tasks' => $taskData,
                'members' => $memberData
            ]);

            // DEBUG: Log the final prompt before sending to OpenRouter
            Log::info('DEBUG: Final prompt being sent to OpenRouter for task distribution:', [
                'system_message' => $systemMessage,
                'user_message' => $userMessage
            ]);

            // Get a working model
            $modelToUse = $this->getWorkingModel();

            // Make API request
            try {
                $response = $http->post($this->baseUrl . '/chat/completions', [
                    'model' => $modelToUse,
                    'messages' => [
                        ['role' => 'system', 'content' => $systemMessage],
                        ['role' => 'user', 'content' => $userMessage],
                    ],
                    'temperature' => 0.1,
                    'response_format' => ["type" => "json_object"],
                ]);

                // DEBUG: Log the response status and raw response body
                Log::info('DEBUG: OpenRouter task distribution response status:', [
                    'status' => $response->status()
                ]);

                // Get and log the raw response body
                $rawResponseText = $response->body();
                Log::info('DEBUG: Raw OpenRouter task distribution response body:', [
                    'raw_response' => $rawResponseText
                ]);

                if ($response->failed()) {
                    Log::error('OpenRouter API request failed for task distribution', [
                        'status' => $response->status(),
                        'reason' => $response->reason(),
                        'body' => $rawResponseText
                    ]);

                    // Fallback: simple round-robin distribution
                    return $this->fallbackDistributeTasks($tasks, $groupMembers);
                }

                // Now try to parse the text as JSON
                $data = json_decode($rawResponseText, true);

                if (json_last_error() !== JSON_ERROR_NONE) {
                    Log::error('DEBUG: Error parsing OpenRouter task distribution response as JSON:', [
                        'error' => json_last_error_msg(),
                        'raw_response' => $rawResponseText
                    ]);
                    return $this->fallbackDistributeTasks($tasks, $groupMembers);
                }

            } catch (\Exception $e) {
                Log::error('DEBUG: An error occurred during the OpenRouter task distribution call:', [
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString()
                ]);

                return $this->fallbackDistributeTasks($tasks, $groupMembers);
            }

            if (!isset($data['choices'][0]['message']['content'])) {
                Log::error('Invalid AI response for task distribution', ['response' => $data]);
                return $this->fallbackDistributeTasks($tasks, $groupMembers);
            }

            $rawContent = $data['choices'][0]['message']['content'];
            $assignments = $this->robustJsonDecode($rawContent);

            if (!is_array($assignments)) {
                Log::error('Failed to parse AI task distribution response', [
                    'raw_content' => $rawContent
                ]);
                return $this->fallbackDistributeTasks($tasks, $groupMembers);
            }

            // Merge assignments back into tasks
            $assignmentMap = [];
            foreach ($assignments as $assignment) {
                if (isset($assignment['id']) && isset($assignment['assigned_user_id'])) {
                    $assignmentMap[$assignment['id']] = $assignment['assigned_user_id'];
                }
            }

            foreach ($tasks as &$task) {
                if (isset($assignmentMap[$task['id']])) {
                    $task['assigned_user_id'] = $assignmentMap[$task['id']];
                }
            }

            return $tasks;
        } catch (\Exception $e) {
            Log::error('Exception in distributeTasks', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Fallback: simple round-robin distribution
            return $this->fallbackDistributeTasks($tasks, $groupMembers);
        }
    }

    /**
     * Fallback method for distributing tasks when AI fails
     * Uses a simple round-robin approach based on effort and importance
     */
    protected function fallbackDistributeTasks(array $tasks, array $groupMembers): array
    {
        // Sort tasks by combined effort and importance (descending)
        usort($tasks, function($a, $b) {
            $aScore = ($a['effort_hours'] ?? 1) * ($a['importance'] ?? 3);
            $bScore = ($b['effort_hours'] ?? 1) * ($b['importance'] ?? 3);
            return $bScore <=> $aScore;
        });

        // Calculate initial workload for each member (starting at 0)
        $memberWorkloads = [];
        foreach ($groupMembers as $member) {
            $memberWorkloads[$member['id']] = 0;
        }

        // Assign tasks to members with the lowest current workload
        foreach ($tasks as &$task) {
            // Find member with lowest workload
            $minWorkload = PHP_INT_MAX;
            $minMemberId = null;

            foreach ($memberWorkloads as $memberId => $workload) {
                if ($workload < $minWorkload) {
                    $minWorkload = $workload;
                    $minMemberId = $memberId;
                }
            }

            // Assign task to this member
            $task['assigned_user_id'] = $minMemberId;

            // Update member's workload
            $taskWeight = ($task['effort_hours'] ?? 1) * ($task['importance'] ?? 3);
            $memberWorkloads[$minMemberId] += $taskWeight;
        }

        return $tasks;
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

    protected function robustJsonDecode($json)
    {
        // Check if input is null or not a string
        if ($json === null) {
            Log::error('Null input passed to robustJsonDecode');
            return null;
        }

        if (!is_string($json)) {
            Log::error('Non-string input passed to robustJsonDecode', ['type' => gettype($json)]);
            return null;
        }

        // Try the original JSON string first
        $cleaned = trim($json);
        $decoded = json_decode($cleaned, true);

        if (json_last_error() === JSON_ERROR_NONE) {
            return $decoded;
        }

        // Try removing any markdown code block markers
        $cleanedMarkdown = preg_replace('/```(?:json)?\s*(.*?)\s*```/s', '$1', $cleaned);
        $decoded = json_decode($cleanedMarkdown, true);

        if (json_last_error() === JSON_ERROR_NONE) {
            return $decoded;
        }

        // Try fixing common JSON syntax errors
        $fixedJson = $this->attemptToFixJsonSyntax($cleaned);
        $decoded = json_decode($fixedJson, true);

        if (json_last_error() === JSON_ERROR_NONE) {
            return $decoded;
        }

        // If all attempts failed, log the JSON and return null
        Log::error('Failed to parse JSON', [
            'original' => $json,
            'cleaned' => $cleaned,
            'cleaned_markdown' => $cleanedMarkdown,
            'fixed_json' => $fixedJson,
            'last_error' => json_last_error_msg()
        ]);

        return null;
    }

    /**
     * Attempt to fix common JSON syntax errors
     */
    private function attemptToFixJsonSyntax(string $json): string
    {
        // Remove any non-JSON content before or after the actual JSON object
        if (preg_match('/(\{.*\})/s', $json, $matches)) {
            $json = $matches[1];
        }

        // Replace single quotes with double quotes (common mistake)
        $json = str_replace("'", '"', $json);

        // Remove trailing commas in objects and arrays
        $json = preg_replace('/,\s*}/', '}', $json);
        $json = preg_replace('/,\s*]/', ']', $json);

        // Try to handle unquoted property names
        $json = preg_replace('/(\{|\,)\s*([a-zA-Z0-9_]+)\s*:/', '$1"$2":', $json);

        return $json;
    }
}
