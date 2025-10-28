<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class GoogleCalendar extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'calendar_id',
    ];

    protected $casts = [
        'token_expires_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function syncEvents($tasks, $assignments)
    {
        try {
            \Illuminate\Support\Facades\Log::info('Starting Google Calendar sync', [
                'user_id' => $this->user_id,
                'tasks_count' => count($tasks),
                'assignments_count' => count($assignments)
            ]);

            // Check if token needs refresh
            if ($this->token_expires_at && $this->token_expires_at->isPast()) {
                $this->refreshToken();
            }

            // Verify we have a valid token
            if (empty($this->access_token)) {
                throw new \Exception('Google Calendar access token is empty or invalid. Please reconnect your account.');
            }

            // Get existing events from Google Calendar and build a map of localId to event
            $existingEventMap = [];
            try {
                $existingEvents = $this->getExistingEvents();
                foreach ($existingEvents as $event) {
                    if (isset($event['extendedProperties']['private']['localId'])) {
                        $localId = $event['extendedProperties']['private']['localId'];
                        $existingEventMap[$localId] = $event;
                    }
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to fetch existing events', [
                    'user_id' => $this->user_id,
                    'error' => $e->getMessage()
                ]);
                // Continue with empty map if we can't fetch existing events
            }

            $successCount = 0;
            $skipCount = 0;
            $failureCount = 0;
            $deletedCount = 0;

            // Track all current local IDs to detect deleted items
            $currentLocalIds = [];

            // Sync tasks
            foreach ($tasks as $task) {
                try {
                    $localId = 'wf-task-' . $task->id;
                    $currentLocalIds[] = $localId;

                    // Check if task needs to be synced by comparing last_updated with last_synced
                    $needsSync = true;

                    if (isset($existingEventMap[$localId])) {
                        // Check if the task has been modified since last sync
                        $lastSyncTime = null;
                        if (isset($existingEventMap[$localId]['extendedProperties']['private']['lastSyncTime'])) {
                            $lastSyncTime = Carbon::parse($existingEventMap[$localId]['extendedProperties']['private']['lastSyncTime']);
                        }

                        $lastUpdateTime = $task->updated_at ?? Carbon::now();

                        if ($lastSyncTime && $lastUpdateTime->lte($lastSyncTime)) {
                            // Task hasn't changed since last sync, skip it
                            $needsSync = false;
                            $skipCount++;
                            \Illuminate\Support\Facades\Log::info('Skipping unchanged task', [
                                'task_id' => $task->id,
                                'title' => $task->title,
                                'last_update' => $lastUpdateTime->toIso8601String(),
                                'last_sync' => $lastSyncTime->toIso8601String()
                            ]);
                        }
                    }

                    if ($needsSync) {
                        $eventData = $this->createEventDataForTask($task);

                        // Add sync timestamp to track when this was last synced
                        $currentTime = Carbon::now()->toIso8601String();
                        if (!isset($eventData['extendedProperties'])) {
                            $eventData['extendedProperties'] = ['private' => []];
                        }
                        if (!isset($eventData['extendedProperties']['private'])) {
                            $eventData['extendedProperties']['private'] = [];
                        }
                        $eventData['extendedProperties']['private']['localId'] = $localId;
                        $eventData['extendedProperties']['private']['appSource'] = 'workflow';
                        $eventData['extendedProperties']['private']['lastSyncTime'] = $currentTime;

                        if (isset($existingEventMap[$localId])) {
                            // Update existing event using Google's event ID
                            $this->updateEvent($existingEventMap[$localId]['id'], $eventData);
                            $successCount++;
                            \Illuminate\Support\Facades\Log::info('Updated task in Google Calendar', [
                                'task_id' => $task->id,
                                'title' => $task->title
                            ]);
                        } else {
                            // Create new event
                            $retryCount = 0;
                            $maxRetries = 3;

                            while ($retryCount < $maxRetries) {
                                try {
                                    $this->createEvent($eventData);
                                    $successCount++;
                                    \Illuminate\Support\Facades\Log::info('Created task in Google Calendar', [
                                        'task_id' => $task->id,
                                        'title' => $task->title
                                    ]);
                                    break; // Success, exit the retry loop
                                } catch (\Exception $e) {
                                    $retryCount++;
                                    if ($retryCount >= $maxRetries) {
                                        throw $e; // Re-throw after max retries
                                    }
                                    // Wait briefly before retrying
                                    usleep(500000); // 0.5 seconds
                                }
                            }
                        }
                    }
                } catch (\Exception $e) {
                    $failureCount++;
                    \Illuminate\Support\Facades\Log::error('Error syncing task', [
                        'user_id' => $this->user_id,
                        'task_id' => $task->id,
                        'error' => $e->getMessage()
                    ]);
                    // Continue with next task
                }
            }

            // Sync assignments
            foreach ($assignments as $assignment) {
                try {
                    $localId = 'wf-assignment-' . $assignment->id;
                    $currentLocalIds[] = $localId;

                    // Check if assignment needs to be synced
                    $needsSync = true;

                    if (isset($existingEventMap[$localId])) {
                        // Check if the assignment has been modified since last sync
                        $lastSyncTime = null;
                        if (isset($existingEventMap[$localId]['extendedProperties']['private']['lastSyncTime'])) {
                            $lastSyncTime = Carbon::parse($existingEventMap[$localId]['extendedProperties']['private']['lastSyncTime']);
                        }

                        $lastUpdateTime = $assignment->updated_at ?? Carbon::now();

                        if ($lastSyncTime && $lastUpdateTime->lte($lastSyncTime)) {
                            // Assignment hasn't changed since last sync, skip it
                            $needsSync = false;
                            $skipCount++;
                            \Illuminate\Support\Facades\Log::info('Skipping unchanged assignment', [
                                'assignment_id' => $assignment->id,
                                'title' => $assignment->title,
                                'last_update' => $lastUpdateTime->toIso8601String(),
                                'last_sync' => $lastSyncTime->toIso8601String()
                            ]);
                        }
                    }

                    if ($needsSync) {
                        $eventData = $this->createEventDataForAssignment($assignment);

                        // Add sync timestamp
                        $currentTime = Carbon::now()->toIso8601String();
                        if (!isset($eventData['extendedProperties'])) {
                            $eventData['extendedProperties'] = ['private' => []];
                        }
                        if (!isset($eventData['extendedProperties']['private'])) {
                            $eventData['extendedProperties']['private'] = [];
                        }
                        $eventData['extendedProperties']['private']['localId'] = $localId;
                        $eventData['extendedProperties']['private']['appSource'] = 'workflow';
                        $eventData['extendedProperties']['private']['lastSyncTime'] = $currentTime;

                        if (isset($existingEventMap[$localId])) {
                            // Update existing event using Google's event ID
                            $this->updateEvent($existingEventMap[$localId]['id'], $eventData);
                            $successCount++;
                            \Illuminate\Support\Facades\Log::info('Updated assignment in Google Calendar', [
                                'assignment_id' => $assignment->id,
                                'title' => $assignment->title
                            ]);
                        } else {
                            // Create new event
                            $retryCount = 0;
                            $maxRetries = 3;

                            while ($retryCount < $maxRetries) {
                                try {
                                    $this->createEvent($eventData);
                                    $successCount++;
                                    \Illuminate\Support\Facades\Log::info('Created assignment in Google Calendar', [
                                        'assignment_id' => $assignment->id,
                                        'title' => $assignment->title
                                    ]);
                                    break; // Success, exit the retry loop
                                } catch (\Exception $e) {
                                    $retryCount++;
                                    if ($retryCount >= $maxRetries) {
                                        throw $e; // Re-throw after max retries
                                    }
                                    // Wait briefly before retrying
                                    usleep(500000); // 0.5 seconds
                                }
                            }
                        }
                    }
                } catch (\Exception $e) {
                    $failureCount++;
                    \Illuminate\Support\Facades\Log::error('Error syncing assignment', [
                        'user_id' => $this->user_id,
                        'assignment_id' => $assignment->id,
                        'error' => $e->getMessage()
                    ]);
                    // Continue with next assignment
                }
            }

            // Delete events that no longer exist in our database
            foreach ($existingEventMap as $localId => $event) {
                if (!in_array($localId, $currentLocalIds)) {
                    try {
                        // This event doesn't exist in our database anymore, delete it from Google Calendar
                        \Illuminate\Support\Facades\Log::info('Deleting event that no longer exists locally', [
                            'local_id' => $localId,
                            'google_event_id' => $event['id'],
                            'summary' => $event['summary']
                        ]);
                        $this->deleteEvent($event['id']);
                        $deletedCount++;
                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::error('Error deleting obsolete event', [
                            'local_id' => $localId,
                            'google_event_id' => $event['id'],
                            'error' => $e->getMessage()
                        ]);
                    }
                }
            }

            // Log sync results
            \Illuminate\Support\Facades\Log::info('Google Calendar sync completed', [
                'user_id' => $this->user_id,
                'success_count' => $successCount,
                'skip_count' => $skipCount,
                'deleted_count' => $deletedCount,
                'failure_count' => $failureCount,
                'total_items' => count($tasks) + count($assignments)
            ]);

            // Return statistics about the sync operation
            return [
                'success_count' => $successCount,
                'skip_count' => $skipCount,
                'deleted_count' => $deletedCount,
                'failure_count' => $failureCount,
                'total_items' => count($tasks) + count($assignments)
            ];
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Critical error in Google Calendar sync', [
                'user_id' => $this->user_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    private function refreshToken()
    {
        try {
            \Illuminate\Support\Facades\Log::info('Refreshing Google Calendar token', [
                'user_id' => $this->user_id
            ]);

            $response = Http::withoutVerifying()->post('https://oauth2.googleapis.com/token', [
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'refresh_token' => $this->refresh_token,
                'grant_type' => 'refresh_token',
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $this->access_token = $data['access_token'];
                $this->token_expires_at = Carbon::now()->addSeconds($data['expires_in']);
                $this->save();

                \Illuminate\Support\Facades\Log::info('Google Calendar token refreshed successfully', [
                    'user_id' => $this->user_id,
                    'expires_at' => $this->token_expires_at
                ]);
            } else {
                // Log detailed error response
                \Illuminate\Support\Facades\Log::error('Failed to refresh Google Calendar token', [
                    'user_id' => $this->user_id,
                    'status' => $response->status(),
                    'response' => $response->json() ?? $response->body()
                ]);

                throw new \Exception('Failed to refresh Google Calendar token: ' . ($response->json()['error_description'] ?? $response->reason()));
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Exception during token refresh', [
                'user_id' => $this->user_id,
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }

    private function getExistingEvents()
    {
        try {
            \Illuminate\Support\Facades\Log::info('Fetching existing Google Calendar events', [
                'user_id' => $this->user_id,
                'calendar_id' => $this->calendar_id
            ]);

            if (empty($this->access_token)) {
                throw new \Exception('Access token is empty');
            }

            $response = Http::withoutVerifying()->withToken($this->access_token)
                ->get("https://www.googleapis.com/calendar/v3/calendars/{$this->calendar_id}/events", [
                    'maxResults' => 2500,
                    'singleEvents' => true,
                    'privateExtendedProperty' => 'appSource=workflow'
                ]);

            if (!$response->successful()) {
                \Illuminate\Support\Facades\Log::error('Failed to fetch events', [
                    'user_id' => $this->user_id,
                    'status' => $response->status(),
                    'response' => $response->json() ?? $response->body()
                ]);
                throw new \Exception('Failed to fetch events: ' . ($response->json()['error']['message'] ?? $response->body()));
            }

            $responseData = $response->json();
            $events = [];

            foreach ($responseData['items'] ?? [] as $event) {
                // Check for extendedProperties before accessing
                if (isset($event['extendedProperties']['private']['appSource']) &&
                    $event['extendedProperties']['private']['appSource'] === 'workflow' &&
                    isset($event['extendedProperties']['private']['localId'])) {

                    $localId = $event['extendedProperties']['private']['localId'];

                    // Log the event ID for debugging
                    \Illuminate\Support\Facades\Log::debug('Processing existing event', [
                        'event_id' => $event['id'],
                        'local_id' => $localId,
                        'summary' => $event['summary'],
                        'extended_properties' => $event['extendedProperties']
                    ]);

                    $events[$localId] = $event;
                }
            }

            \Illuminate\Support\Facades\Log::info('Fetched Google Calendar events', [
                'user_id' => $this->user_id,
                'event_count' => count($events),
                'events' => array_keys($events)
            ]);

            return $events;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Exception in getExistingEvents', [
                'user_id' => $this->user_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            // Return empty array instead of re-throwing to allow sync to continue
            return [];
        }
    }

    private function getEventIdForTask($task)
    {
        // Use a simple alphanumeric format that's guaranteed to be valid
        // Format: wf-task-{id}
        return 'wf-task-' . $task->id;
    }

    /**
     * Sync a single task to Google Calendar
     *
     * @param \App\Models\GroupTask $task
     * @return bool
     * @throws \Exception
     */
    public function syncSingleTask($task)
    {
        try {
            \Illuminate\Support\Facades\Log::info('Starting single task sync', [
                'user_id' => $this->user_id,
                'task_id' => $task->id,
                'task_title' => $task->title,
                'start_date' => $task->start_date,
                'end_date' => $task->end_date
            ]);

            // Check if token needs refresh
            if ($this->token_expires_at && $this->token_expires_at->isPast()) {
                \Illuminate\Support\Facades\Log::info('Token expired, attempting refresh', [
                    'user_id' => $this->user_id,
                    'expires_at' => $this->token_expires_at
                ]);
                $this->refreshToken();
            }

            // Verify we have a valid token
            if (empty($this->access_token)) {
                \Illuminate\Support\Facades\Log::error('Empty access token in syncSingleTask', [
                    'user_id' => $this->user_id,
                    'task_id' => $task->id
                ]);
                throw new \Exception('Google Calendar access token is empty or invalid. Please reconnect your account.');
            }

            $eventId = $this->getEventIdForTask($task);
            $eventData = $this->createEventDataForTask($task);

            \Illuminate\Support\Facades\Log::info('Checking if event exists', [
                'user_id' => $this->user_id,
                'task_id' => $task->id,
                'event_id' => $eventId,
                'calendar_id' => $this->calendar_id
            ]);

            // Check if event already exists
            $response = Http::withoutVerifying()->withToken($this->access_token)
                ->get("https://www.googleapis.com/calendar/v3/calendars/{$this->calendar_id}/events/{$eventId}");

            if ($response->successful()) {
                // Update existing event
                \Illuminate\Support\Facades\Log::info('Event exists, updating', [
                    'user_id' => $this->user_id,
                    'task_id' => $task->id,
                    'event_id' => $eventId
                ]);
                $result = $this->updateEvent($eventId, $eventData);
                \Illuminate\Support\Facades\Log::info('Updated task event in Google Calendar', [
                    'user_id' => $this->user_id,
                    'task_id' => $task->id,
                    'event_id' => $eventId,
                    'html_link' => $result['htmlLink'] ?? null
                ]);
            } else {
                // Create new event
                \Illuminate\Support\Facades\Log::info('Event does not exist, creating new', [
                    'user_id' => $this->user_id,
                    'task_id' => $task->id,
                    'event_id' => $eventId
                ]);
                $result = $this->createEvent($eventData, $eventId);
                \Illuminate\Support\Facades\Log::info('Created task event in Google Calendar', [
                    'user_id' => $this->user_id,
                    'task_id' => $task->id,
                    'event_id' => $eventId,
                    'html_link' => $result['htmlLink'] ?? null
                ]);
            }

            return true;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error syncing single task to Google Calendar', [
                'user_id' => $this->user_id,
                'task_id' => $task->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    private function getEventIdForAssignment($assignment)
    {
        // Use a simple alphanumeric format that's guaranteed to be valid
        // Format: wf-assignment-{id}
        return 'wf-assignment-' . $assignment->id;
    }

    private function getIdFromEventId($eventId)
    {
        // Extract the original ID from the event ID
        if (str_starts_with($eventId, 'wf-task-')) {
            return (int) substr($eventId, 8); // Remove 'wf-task-' prefix
        } elseif (str_starts_with($eventId, 'wf-assignment-')) {
            return (int) substr($eventId, 14); // Remove 'wf-assignment-' prefix
        }
        return null;
    }

    private function createEventDataForTask($task)
    {
        // Log the incoming task data
        \Illuminate\Support\Facades\Log::info('Creating event data for task', [
            'task_id' => $task->id,
            'title' => $task->title,
            'raw_start_date' => $task->start_date,
            'raw_end_date' => $task->end_date
        ]);

        // Parse dates and ensure they're in the correct format
        $startDate = Carbon::parse($task->start_date);
        $endDate = Carbon::parse($task->end_date);

        // If end date is before start date, adjust it
        if ($endDate->lt($startDate)) {
            $endDate = clone $startDate;
            \Illuminate\Support\Facades\Log::warning('Task end date was before start date, adjusted', [
                'task_id' => $task->id,
                'original_end_date' => $task->end_date,
                'adjusted_end_date' => $endDate->toRfc3339String()
            ]);
        }

        // Get the user's timezone or fall back to config
        $timezone = config('app.timezone', 'UTC');

        // For all-day events, use date format
        $isAllDay = $startDate->format('H:i:s') === '00:00:00' && $endDate->format('H:i:s') === '00:00:00';

        $eventData = [
            'summary' => $task->title,
            'description' => "Task: {$task->title}\n" .
                "Priority: {$task->priority}\n" .
                "Status: {$task->status}",
            'start' => $isAllDay ? [
                'date' => $startDate->format('Y-m-d'),
                'timeZone' => $timezone,
            ] : [
                'dateTime' => $startDate->toRfc3339String(),
                'timeZone' => $timezone,
            ],
            'end' => $isAllDay ? [
                'date' => $endDate->format('Y-m-d'),
                'timeZone' => $timezone,
            ] : [
                'dateTime' => $endDate->toRfc3339String(),
                'timeZone' => $timezone,
            ],
            'colorId' => $this->getColorIdForPriority($task->priority),
            'extendedProperties' => [
                'private' => [
                    'appSource' => 'workflow',
                    'type' => 'task',
                    'id' => $task->id,
                ]
            ]
        ];

        // Log the formatted event data
        \Illuminate\Support\Facades\Log::info('Formatted event data', [
            'task_id' => $task->id,
            'event_data' => [
                'summary' => $eventData['summary'],
                'start' => $eventData['start'],
                'end' => $eventData['end'],
                'timezone' => $timezone,
                'is_all_day' => $isAllDay
            ]
        ]);

        return $eventData;
    }

    private function createEventDataForAssignment($assignment)
    {
        // Log the incoming assignment data
        \Illuminate\Support\Facades\Log::info('Creating event data for assignment', [
            'assignment_id' => $assignment->id,
            'title' => $assignment->title,
            'raw_start_date' => $assignment->start_date,
            'raw_end_date' => $assignment->end_date
        ]);

        // Parse dates and ensure they're in the correct format
        $startDate = Carbon::parse($assignment->start_date);
        $endDate = Carbon::parse($assignment->end_date);

        // If end date is before start date, adjust it
        if ($endDate->lt($startDate)) {
            $endDate = clone $startDate;
            \Illuminate\Support\Facades\Log::warning('Assignment end date was before start date, adjusted', [
                'assignment_id' => $assignment->id,
                'original_end_date' => $assignment->end_date,
                'adjusted_end_date' => $endDate->toRfc3339String()
            ]);
        }

        // Get the user's timezone or fall back to config
        $timezone = config('app.timezone', 'UTC');

        // For all-day events, use date format
        $isAllDay = $startDate->format('H:i:s') === '00:00:00' && $endDate->format('H:i:s') === '00:00:00';

        $eventData = [
            'summary' => $assignment->title,
            'description' => "Assignment: {$assignment->title}\n" .
                "Due Date: {$endDate->format('Y-m-d H:i:s')}\n" .
                "Status: {$assignment->status}",
            'start' => $isAllDay ? [
                'date' => $startDate->format('Y-m-d'),
                'timeZone' => $timezone,
            ] : [
                'dateTime' => $startDate->toRfc3339String(),
                'timeZone' => $timezone,
            ],
            'end' => $isAllDay ? [
                'date' => $endDate->format('Y-m-d'),
                'timeZone' => $timezone,
            ] : [
                'dateTime' => $endDate->toRfc3339String(),
                'timeZone' => $timezone,
            ],
            'colorId' => '9', // Use a different color for assignments
            'extendedProperties' => [
                'private' => [
                    'appSource' => 'workflow',
                    'type' => 'assignment',
                    'id' => $assignment->id,
                ]
            ]
        ];

        // Log the formatted event data
        \Illuminate\Support\Facades\Log::info('Formatted event data', [
            'assignment_id' => $assignment->id,
            'event_data' => [
                'summary' => $eventData['summary'],
                'start' => $eventData['start'],
                'end' => $eventData['end'],
                'timezone' => $timezone,
                'is_all_day' => $isAllDay
            ]
        ]);

        return $eventData;
    }

    private function createEvent($eventData)
    {
        if (empty($this->access_token)) {
            \Illuminate\Support\Facades\Log::error('Empty access token in createEvent', [
                'user_id' => $this->user_id
            ]);
            throw new \Exception('Access token is empty. Please reconnect your Google Calendar.');
        }

        // Log the event data we're about to send
        \Illuminate\Support\Facades\Log::info('Creating Google Calendar event', [
            'user_id' => $this->user_id,
            'calendar_id' => $this->calendar_id,
            'event_data' => [
                'summary' => $eventData['summary'],
                'start' => $eventData['start'],
                'end' => $eventData['end'],
                'extended_properties' => $eventData['extendedProperties'] ?? null
            ]
        ]);

        $url = "https://www.googleapis.com/calendar/v3/calendars/{$this->calendar_id}/events";

        try {
            $response = Http::withoutVerifying()
                ->withToken($this->access_token)
                ->post($url, $eventData);

            if (!$response->successful()) {
                \Illuminate\Support\Facades\Log::error('Failed to create Google Calendar event', [
                    'user_id' => $this->user_id,
                    'status' => $response->status(),
                    'response' => $response->json() ?? $response->body(),
                    'calendar_id' => $this->calendar_id,
                    'event_data' => $eventData
                ]);
                throw new \Exception('Failed to create Google Calendar event: ' . ($response->json()['error']['message'] ?? $response->body()));
            }

            $createdEvent = $response->json();
            \Illuminate\Support\Facades\Log::info('Successfully created Google Calendar event', [
                'user_id' => $this->user_id,
                'google_event_id' => $createdEvent['id'],
                'local_id' => $eventData['extendedProperties']['private']['localId'] ?? null,
                'html_link' => $createdEvent['htmlLink'] ?? null,
                'extended_properties' => $createdEvent['extendedProperties'] ?? null
            ]);

            return $createdEvent;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Exception in createEvent', [
                'user_id' => $this->user_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'calendar_id' => $this->calendar_id
            ]);
            throw $e;
        }
    }

    private function updateEvent($eventId, $eventData)
    {
        if (empty($this->access_token)) {
            \Illuminate\Support\Facades\Log::error('Empty access token in updateEvent', [
                'user_id' => $this->user_id
            ]);
            throw new \Exception('Access token is empty. Please reconnect your Google Calendar.');
        }

        \Illuminate\Support\Facades\Log::info('Updating Google Calendar event', [
            'user_id' => $this->user_id,
            'google_event_id' => $eventId,
            'calendar_id' => $this->calendar_id,
            'event_data' => [
                'summary' => $eventData['summary'],
                'start' => $eventData['start'],
                'end' => $eventData['end'],
                'extended_properties' => $eventData['extendedProperties'] ?? null
            ]
        ]);

        $url = "https://www.googleapis.com/calendar/v3/calendars/{$this->calendar_id}/events/{$eventId}";

        try {
            $response = Http::withoutVerifying()
                ->withToken($this->access_token)
                ->put($url, $eventData);

            if (!$response->successful()) {
                \Illuminate\Support\Facades\Log::error('Failed to update Google Calendar event', [
                    'user_id' => $this->user_id,
                    'status' => $response->status(),
                    'response' => $response->json() ?? $response->body(),
                    'calendar_id' => $this->calendar_id,
                    'google_event_id' => $eventId,
                    'event_data' => $eventData
                ]);
                throw new \Exception('Failed to update Google Calendar event: ' . ($response->json()['error']['message'] ?? $response->body()));
            }

            $updatedEvent = $response->json();
            \Illuminate\Support\Facades\Log::info('Successfully updated Google Calendar event', [
                'user_id' => $this->user_id,
                'google_event_id' => $eventId,
                'html_link' => $updatedEvent['htmlLink'] ?? null,
                'extended_properties' => $updatedEvent['extendedProperties'] ?? null
            ]);

            return $updatedEvent;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Exception in updateEvent', [
                'user_id' => $this->user_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'calendar_id' => $this->calendar_id,
                'google_event_id' => $eventId
            ]);
            throw $e;
        }
    }

    private function deleteEvent($eventId)
    {
        if (empty($this->access_token)) {
            \Illuminate\Support\Facades\Log::error('Empty access token in deleteEvent', [
                'user_id' => $this->user_id
            ]);
            throw new \Exception('Access token is empty. Please reconnect your Google Calendar.');
        }

        $url = "https://www.googleapis.com/calendar/v3/calendars/{$this->calendar_id}/events/{$eventId}";

        \Illuminate\Support\Facades\Log::info('Deleting Google Calendar event', [
            'user_id' => $this->user_id,
            'event_id' => $eventId,
            'url' => $url
        ]);

        $response = Http::withoutVerifying()->withToken($this->access_token)
            ->delete($url);

        if (!$response->successful()) {
            \Illuminate\Support\Facades\Log::error('Failed to delete Google Calendar event', [
                'user_id' => $this->user_id,
                'event_id' => $eventId,
                'status' => $response->status(),
                'response' => $response->body()
            ]);
            throw new \Exception('Failed to delete Google Calendar event: ' . $response->body());
        }

        \Illuminate\Support\Facades\Log::info('Successfully deleted Google Calendar event', [
            'user_id' => $this->user_id,
            'event_id' => $eventId
        ]);
    }

    private function getColorIdForPriority($priority)
    {
        return match ($priority) {
            'high' => '11', // Red
            'medium' => '6', // Orange
            'low' => '10', // Green
            default => '8', // Gray
        };
    }
}
