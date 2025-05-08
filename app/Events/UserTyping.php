<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserTyping implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userId;
    public $receiverId;
    public $groupId;
    public $userName;

    /**
     * Create a new event instance.
     */
    public function __construct($userId, $userName, $receiverId = null, $groupId = null)
    {
        $this->userId = $userId;
        $this->userName = $userName;
        $this->receiverId = $receiverId;
        $this->groupId = $groupId;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        if ($this->groupId) {
            return [
                new PresenceChannel('group.'.$this->groupId),
            ];
        }

        return [
            new PrivateChannel('chat.'.$this->receiverId),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'user.typing';
    }
} 