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
        // Check if token needs refresh
        if ($this->token_expires_at->isPast()) {
            $this->refreshToken();
        }
        
        // Get existing events from Google Calendar
        $existingEvents = $this->getExistingEvents();
        
        // Sync tasks
        foreach ($tasks as $task) {
            $eventId = $this->getEventIdForTask($task);
            $eventData = $this->createEventData($task);
            
            if (isset($existingEvents[$eventId])) {
                // Update existing event
                $this->updateEvent($eventId, $eventData);
            } else {
                // Create new event
                $this->createEvent($eventData);
            }
        }
        
        // Sync assignments
        foreach ($assignments as $assignment) {
            $eventId = $this->getEventIdForAssignment($assignment);
            $eventData = $this->createEventData($assignment);
            
            if (isset($existingEvents[$eventId])) {
                // Update existing event
                $this->updateEvent($eventId, $eventData);
            } else {
                // Create new event
                $this->createEvent($eventData);
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
                $this->deleteEvent($eventId);
            } elseif ($type === 'assignment' && !$assignments->contains('id', $id)) {
                $this->deleteEvent($eventId);
            }
        }
    }
    
    private function refreshToken()
    {
        $response = Http::post('https://oauth2.googleapis.com/token', [
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
        } else {
            throw new \Exception('Failed to refresh Google Calendar token');
        }
    }
    
    private function getExistingEvents()
    {
        $response = Http::withToken($this->access_token)
            ->get("https://www.googleapis.com/calendar/v3/calendars/{$this->calendar_id}/events", [
                'timeMin' => Carbon::now()->subMonths(3)->toRfc3339String(),
                'timeMax' => Carbon::now()->addMonths(3)->toRfc3339String(),
                'singleEvents' => true,
                'orderBy' => 'startTime',
            ]);
            
        if (!$response->successful()) {
            throw new \Exception('Failed to fetch Google Calendar events');
        }
        
        $events = [];
        foreach ($response->json()['items'] as $event) {
            if (isset($event['extendedProperties']['private']['appSource']) && 
                $event['extendedProperties']['private']['appSource'] === 'workflow') {
                $events[$event['id']] = $event;
            }
        }
        
        return $events;
    }
    
    private function getEventIdForTask($task)
    {
        return 'task_' . $task->id;
    }
    
    private function getEventIdForAssignment($assignment)
    {
        return 'assignment_' . $assignment->id;
    }
    
    private function createEventData($item)
    {
        $isTask = $item instanceof \App\Models\Task;
        
        $eventData = [
            'summary' => $item->title,
            'description' => $isTask 
                ? "Task: {$item->title}\nPriority: {$item->priority}\nStatus: {$item->status}\nProgress: {$item->progress}%"
                : "Assignment: {$item->title}",
            'start' => [
                'date' => $item->start_date->format('Y-m-d'),
                'timeZone' => config('app.timezone'),
            ],
            'end' => [
                'date' => $item->end_date->format('Y-m-d'),
                'timeZone' => config('app.timezone'),
            ],
            'colorId' => $isTask ? $this->getColorIdForPriority($item->priority) : '1', // Blue for assignments
            'extendedProperties' => [
                'private' => [
                    'appSource' => 'workflow',
                    'type' => $isTask ? 'task' : 'assignment',
                    'id' => $item->id,
                ]
            ]
        ];
        
        if ($isTask) {
            $eventData['extendedProperties']['private']['progress'] = $item->progress;
        }
        
        return $eventData;
    }
    
    private function createEvent($eventData)
    {
        $response = Http::withToken($this->access_token)
            ->post("https://www.googleapis.com/calendar/v3/calendars/{$this->calendar_id}/events", $eventData);
            
        if (!$response->successful()) {
            throw new \Exception('Failed to create Google Calendar event');
        }
        
        return $response->json();
    }
    
    private function updateEvent($eventId, $eventData)
    {
        $response = Http::withToken($this->access_token)
            ->put("https://www.googleapis.com/calendar/v3/calendars/{$this->calendar_id}/events/{$eventId}", $eventData);
            
        if (!$response->successful()) {
            throw new \Exception('Failed to update Google Calendar event');
        }
        
        return $response->json();
    }
    
    private function deleteEvent($eventId)
    {
        $response = Http::withToken($this->access_token)
            ->delete("https://www.googleapis.com/calendar/v3/calendars/{$this->calendar_id}/events/{$eventId}");
            
        if (!$response->successful()) {
            throw new \Exception('Failed to delete Google Calendar event');
        }
    }
    
    private function getColorIdForPriority($priority)
    {
        return match ($priority) {
            'high' => '11', // Red
            'medium' => '6', // Orange
            'low' => '10', // Green
            default => '1', // Blue
        };
    }
} 