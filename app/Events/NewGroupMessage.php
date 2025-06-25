<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewGroupMessage implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * The group message instance.
     *
     * @var \App\Models\GroupChatMessage
     */
    public $message;

    /**
     * The message data.
     *
     * @var array
     */
    public $messageData;

    /**
     * Create a new event instance.
     *
     * @param \App\Models\GroupChatMessage $message
     * @param array $messageData
     */
    public function __construct(\App\Models\GroupChatMessage $message, array $messageData)
    {
        $this->message = $message;
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
        // Make sure we include the group_id in the message data for proper routing
        $enhancedData = $this->messageData;

        if (!isset($enhancedData['group_id'])) {
            $enhancedData['group_id'] = $this->message->group_id;
        }

        // Add conversation_id for client-side filtering (using group_id prefixed with 'group_')
        $enhancedData['conversation_id'] = 'group_' . $this->groupId;

        // Add message type for further distinction
        $enhancedData['message_type'] = 'group';

        return $enhancedData;
    }
}
