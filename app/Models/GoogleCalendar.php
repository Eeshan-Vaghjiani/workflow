<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

class GoogleCalendar extends Model
{
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
            // Check if token needs refresh
            if ($this->token_expires_at && $this->token_expires_at->isPast()) {
                $this->refreshToken();
            }

            // Verify we have a valid token
            if (empty($this->access_token)) {
                \Illuminate\Support\Facades\Log::error('Empty access token in syncEvents', [
                    'user_id' => $this->user_id
                ]);
                throw new \Exception('Google Calendar access token is empty or invalid. Please reconnect your account.');
            }

            // Get existing events from Google Calendar
            $existingEvents = $this->getExistingEvents();

            // Sync tasks
            foreach ($tasks as $task) {
                try {
                    $eventId = $this->getEventIdForTask($task);
                    $eventData = $this->createEventDataForTask($task);

                    if (isset($existingEvents[$eventId])) {
                        // Update existing event
                        $this->updateEvent($eventId, $eventData);
                    } else {
                        // Create new event
                        $this->createEvent($eventData, $eventId);
                    }
                } catch (\Exception $e) {
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
                    $eventId = $this->getEventIdForAssignment($assignment);
                    $eventData = $this->createEventDataForAssignment($assignment);

                    if (isset($existingEvents[$eventId])) {
                        // Update existing event
                        $this->updateEvent($eventId, $eventData);
                    } else {
                        // Create new event
                        $this->createEvent($eventData, $eventId);
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Error syncing assignment', [
                        'user_id' => $this->user_id,
                        'assignment_id' => $assignment->id,
                        'error' => $e->getMessage()
                    ]);
                    // Continue with next assignment
                }
            }

            // Delete events that no longer exist in our system
            foreach ($existingEvents as $eventId => $event) {
                if (!str_starts_with($eventId, 'task_') && !str_starts_with($eventId, 'assignment_')) {
                    continue; // Skip events not created by our app
                }

                $id = substr($eventId, strpos($eventId, '_') + 1);
                $type = str_starts_with($eventId, 'task_') ? 'task' : 'assignment';

                if ($type === 'task' && !$tasks->contains('id', $id)) {
                    try {
                        $this->deleteEvent($eventId);
                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::error('Error deleting task event', [
                            'user_id' => $this->user_id,
                            'event_id' => $eventId,
                            'error' => $e->getMessage()
                        ]);
                    }
                } elseif ($type === 'assignment' && !$assignments->contains('id', $id)) {
                    try {
                        $this->deleteEvent($eventId);
                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::error('Error deleting assignment event', [
                            'user_id' => $this->user_id,
                            'event_id' => $eventId,
                            'error' => $e->getMessage()
                        ]);
                    }
                }
            }

            // Log successful sync
            \Illuminate\Support\Facades\Log::info('Google Calendar sync successful', [
                'user_id' => $this->user_id,
                'tasks_count' => count($tasks),
                'assignments_count' => count($assignments)
            ]);

            return true;
        } catch (\Exception $e) {
            // Log detailed error
            \Illuminate\Support\Facades\Log::error('Google Calendar sync failed', [
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

            $response = Http::withoutVerifying()->withToken($this->access_token)
                ->get("https://www.googleapis.com/calendar/v3/calendars/{$this->calendar_id}/events", [
                    'timeMin' => Carbon::now()->subMonths(3)->toRfc3339String(),
                    'timeMax' => Carbon::now()->addMonths(3)->toRfc3339String(),
                    'singleEvents' => true,
                    'orderBy' => 'startTime',
                ]);

            if (!$response->successful()) {
                \Illuminate\Support\Facades\Log::error('Failed to fetch Google Calendar events', [
                    'user_id' => $this->user_id,
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);
                throw new \Exception('Failed to fetch Google Calendar events: ' . $response->body());
            }

            $events = [];
            $responseData = $response->json();
            
            // Check if 'items' key exists
            if (!isset($responseData['items'])) {
                \Illuminate\Support\Facades\Log::error('Google Calendar response missing items key', [
                    'user_id' => $this->user_id,
                    'response_keys' => array_keys($responseData)
                ]);
                return $events;
            }
            
            foreach ($responseData['items'] as $event) {
                // Check for extendedProperties before accessing
                if (isset($event['extendedProperties']['private']['appSource']) &&
                    $event['extendedProperties']['private']['appSource'] === 'workflow') {
                    $events[$event['id']] = $event;
                }
            }

            \Illuminate\Support\Facades\Log::info('Fetched Google Calendar events', [
                'user_id' => $this->user_id,
                'event_count' => count($events)
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
        return 'task_' . $task->id;
    }

    private function getEventIdForAssignment($assignment)
    {
        return 'assignment_' . $assignment->id;
    }

    private function createEventDataForTask($task)
    {
        return [
            'summary' => $task->title,
            'description' => "Task: {$task->title}\nPriority: {$task->priority}\nStatus: {$task->status}",
            'start' => [
                'date' => Carbon::parse($task->start_date)->format('Y-m-d'),
                'timeZone' => config('app.timezone'),
            ],
            'end' => [
                'date' => Carbon::parse($task->end_date)->format('Y-m-d'),
                'timeZone' => config('app.timezone'),
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
    }

    private function createEventDataForAssignment($assignment)
    {
        return [
            'summary' => $assignment->title,
            'description' => "Assignment: {$assignment->title}",
            'start' => [
                'date' => Carbon::parse($assignment->start_date)->format('Y-m-d'),
                'timeZone' => config('app.timezone'),
            ],
            'end' => [
                'date' => Carbon::parse($assignment->end_date)->format('Y-m-d'),
                'timeZone' => config('app.timezone'),
            ],
            'colorId' => '1', // Blue for assignments
            'extendedProperties' => [
                'private' => [
                    'appSource' => 'workflow',
                    'type' => 'assignment',
                    'id' => $assignment->id,
                ]
            ]
        ];
    }

    private function createEvent($eventData, $eventId = null)
    {
        if (empty($this->access_token)) {
            \Illuminate\Support\Facades\Log::error('Empty access token in createEvent', [
                'user_id' => $this->user_id
            ]);
            throw new \Exception('Access token is empty. Please reconnect your Google Calendar.');
        }

        $url = "https://www.googleapis.com/calendar/v3/calendars/{$this->calendar_id}/events";
        
        // If eventId is provided, add it to the request body
        if ($eventId) {
            $eventData['id'] = $eventId;
        }
        
        \Illuminate\Support\Facades\Log::info('Creating Google Calendar event', [
            'user_id' => $this->user_id,
            'event_id' => $eventId,
            'url' => $url
        ]);
        
        $response = Http::withoutVerifying()->withToken($this->access_token)
            ->post($url, $eventData);

        if (!$response->successful()) {
            \Illuminate\Support\Facades\Log::error('Failed to create Google Calendar event', [
                'user_id' => $this->user_id,
                'status' => $response->status(),
                'response' => $response->body()
            ]);
            throw new \Exception('Failed to create Google Calendar event: ' . $response->body());
        }

        \Illuminate\Support\Facades\Log::info('Successfully created Google Calendar event', [
            'user_id' => $this->user_id,
            'event_id' => $eventId
        ]);

        return $response->json();
    }

    private function updateEvent($eventId, $eventData)
    {
        if (empty($this->access_token)) {
            \Illuminate\Support\Facades\Log::error('Empty access token in updateEvent', [
                'user_id' => $this->user_id
            ]);
            throw new \Exception('Access token is empty. Please reconnect your Google Calendar.');
        }

        $url = "https://www.googleapis.com/calendar/v3/calendars/{$this->calendar_id}/events/{$eventId}";
        
        \Illuminate\Support\Facades\Log::info('Updating Google Calendar event', [
            'user_id' => $this->user_id,
            'event_id' => $eventId,
            'url' => $url
        ]);
        
        $response = Http::withoutVerifying()->withToken($this->access_token)
            ->put($url, $eventData);

        if (!$response->successful()) {
            \Illuminate\Support\Facades\Log::error('Failed to update Google Calendar event', [
                'user_id' => $this->user_id,
                'event_id' => $eventId,
                'status' => $response->status(),
                'response' => $response->body()
            ]);
            throw new \Exception('Failed to update Google Calendar event: ' . $response->body());
        }

        \Illuminate\Support\Facades\Log::info('Successfully updated Google Calendar event', [
            'user_id' => $this->user_id,
            'event_id' => $eventId
        ]);

        return $response->json();
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
