<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GroupMessageDeleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * The ID of the deleted message.
     *
     * @var int|string
     */
    public $messageId;

    /**
     * The message data.
     *
     * @var array
     */
    public $messageData;

    /**
     * Create a new event instance.
     */
    public function __construct($messageId, array $messageData)
    {
        $this->messageId = $messageId;
        $this->messageData = $messageData;

        // Log for debugging
        Log::debug('GroupMessageDeleted event created', [
            'message_id' => $messageId,
            'deleted_by' => $messageData['deleted_by'] ?? null,
            'group_id' => $messageData['group_id'] ?? null
        ]);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // Use simple public channels for reliable delivery
        return [
            new Channel('chat'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'group.message.deleted';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return $this->messageData;
    }
}
