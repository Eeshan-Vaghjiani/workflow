<?php

namespace App\Events;

use App\Models\DirectMessage;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class NewDirectMessage implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * The direct message instance.
     *
     * @var \App\Models\DirectMessage
     */
    public $message;

    /**
     * The formatted message data.
     *
     * @var array
     */
    public $messageData;

    /**
     * Create a new event instance.
     */
    public function __construct(DirectMessage $message, array $messageData)
    {
        $this->message = $message;
        $this->messageData = $messageData;

        // Log for debugging
        Log::debug('NewDirectMessage event created', [
            'receiver_id' => $message->receiver_id,
            'sender_id' => $message->sender_id,
            'message_id' => $message->id
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
        $channels = [
            new Channel('chat'),
        ];

        // Log the channel information for debugging
        Log::debug('NewDirectMessage broadcasting on channels', [
            'channels' => 'chat',
            'message_id' => $this->message->id,
            'sender_id' => $this->message->sender_id,
            'receiver_id' => $this->message->receiver_id
        ]);

        return $channels;
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
        // Make sure we include all necessary data
        $enhancedData = $this->messageData;

        if (!isset($enhancedData['sender_id'])) {
            $enhancedData['sender_id'] = $this->message->sender_id;
        }

        if (!isset($enhancedData['receiver_id'])) {
            $enhancedData['receiver_id'] = $this->message->receiver_id;
        }

        // Add a timestamp if not present
        if (!isset($enhancedData['created_at'])) {
            $enhancedData['created_at'] = $this->message->created_at;
        }

        // Ensure we have the user data
        if (!isset($enhancedData['user']) && isset($this->message->sender)) {
            $enhancedData['user'] = [
                'id' => $this->message->sender->id,
                'name' => $this->message->sender->name,
                'avatar' => $this->message->sender->avatar,
            ];
        }

        Log::debug('Broadcasting message data:', [
            'messageData' => $enhancedData,
            'channel' => 'chat',
            'event' => 'message.new'
        ]);

        return $enhancedData;
    }
}
