<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class MessageDeleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * The message ID that was deleted.
     *
     * @var int
     */
    public $messageId;

    /**
     * The message type (direct or group)
     *
     * @var string
     */
    public $messageType;

    /**
     * Create a new event instance.
     */
    public function __construct(int $messageId, string $messageType = 'direct')
    {
        $this->messageId = $messageId;
        $this->messageType = $messageType;

        // Log for debugging
        Log::debug('MessageDeleted event created', [
            'message_id' => $messageId,
            'message_type' => $messageType,
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
        return 'message.deleted';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'message_id' => $this->messageId,
            'message_type' => $this->messageType,
            'deleted_at' => now()->toIso8601String(),
        ];
    }
}
