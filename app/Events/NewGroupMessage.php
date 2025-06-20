<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewGroupMessage implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * The group ID.
     *
     * @var int
     */
    public $groupId;

    /**
     * The message data.
     *
     * @var array
     */
    public $messageData;

    /**
     * Create a new event instance.
     */
    public function __construct(int $groupId, array $messageData)
    {
        $this->groupId = $groupId;
        $this->messageData = $messageData;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('chat'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'message.new';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array
     */
    public function broadcastWith(): array
    {
        // Include the group_id in the message data for proper routing
        $enhancedData = $this->messageData;
        $enhancedData['group_id'] = $this->groupId;

        return $enhancedData;
    }
}
