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
        Log::debug('Broadcasting direct message', [
            'to_user' => $this->message->receiver_id, 
            'from_user' => $this->message->sender_id,
            'channel' => 'chat.'.$this->message->receiver_id
        ]);
        
        // Only broadcast to the receiver's channel - they'll receive it on their own channel
        return [
            new PrivateChannel('chat.'.$this->message->receiver_id),
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
        // Make sure we include sender/receiver info
        $enhancedData = $this->messageData;
        
        if (!isset($enhancedData['sender_id'])) {
            $enhancedData['sender_id'] = $this->message->sender_id;
        }
        
        if (!isset($enhancedData['receiver_id'])) {
            $enhancedData['receiver_id'] = $this->message->receiver_id;
        }
        
        Log::debug('Broadcasting message data:', [
            'messageData' => $enhancedData,
        ]);
        
        return $enhancedData;
    }
} 