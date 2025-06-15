<?php

namespace App\Http\Controllers;

use App\Models\DirectMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Events\NewDirectMessage;
use App\Events\MessageDeleted;

class DirectMessageController extends Controller
{
    /**
     * Display the messages index.
     */
    public function index()
    {
        return inertia('Chat/DirectMessages', [
            'currentUserId' => auth()->id()
        ]);
    }

    /**
     * Get messages for a direct message conversation with a specific user.
     */
    public function messages(Request $request, $userId)
    {
        try {
            $currentUser = auth()->user();

            if (!$currentUser) {
                Log::error('Unauthorized access to direct messages');
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Convert $userId to integer if it's a string
            $userId = (int) $userId;

            // Check if the user exists
            $user = User::find($userId);
            if (!$user) {
                Log::error('Attempted to access messages with non-existent user', [
                    'requested_user_id' => $userId,
                    'current_user' => $currentUser->id
                ]);

                return response()->json([
                    'error' => 'User not found',
                    'user_id' => $userId
                ], 404);
            }

            Log::info('Fetching direct messages', [
                'current_user' => $currentUser->id,
                'other_user' => $userId,
                'method' => $request->method()
            ]);

            // If this is a GET request, fetch messages
            $messages = DirectMessage::where(function ($query) use ($currentUser, $userId) {
                    $query->where('sender_id', $currentUser->id)
                        ->where('receiver_id', $userId);
                })
                ->orWhere(function ($query) use ($currentUser, $userId) {
                    $query->where('sender_id', $userId)
                        ->where('receiver_id', $currentUser->id);
                })
                ->with('sender:id,name,avatar')
                ->orderBy('created_at', 'asc')
                ->get()
                ->map(function ($message) use ($currentUser) {
                    return [
                        'id' => $message->id,
                        'content' => $message->message,
                        'message' => $message->message,
                        'timestamp' => $message->created_at->format('g:i A'),
                        'date' => $message->created_at->format('M j, Y'),
                        'created_at' => $message->created_at,
                        'is_from_me' => $message->sender_id == $currentUser->id,
                        'user_id' => $message->sender_id,
                        'user' => $message->sender,
                    ];
                });

            // Mark all messages from this user as read
            DirectMessage::where('sender_id', $userId)
                ->where('receiver_id', $currentUser->id)
                ->where('read', false)
                ->update(['read' => true]);

            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'avatar' => $user->avatar,
                'status' => $user->status ?? 'offline',
            ];

            return response()->json([
                'user' => $userData,
                'messages' => $messages,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching direct messages', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'method' => $request->method()
            ]);

            return response()->json([
                'error' => 'Failed to fetch messages',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'message' => 'required|string',
        ]);

        try {
            // Create the message
            $message = new DirectMessage();
            $message->sender_id = Auth::id();
            $message->receiver_id = $request->receiver_id;
            $message->message = $request->message;
            $message->save();

            // Load the sender relationship for the broadcast event
            $message->load('sender');

            // Get the authenticated user
            $user = Auth::user();

            // Format the message data for broadcasting
            $messageData = [
                'id' => $message->id,
                'sender_id' => $message->sender_id,
                'receiver_id' => $message->receiver_id,
                'message' => $message->message,
                'created_at' => $message->created_at,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'avatar' => $user->avatar ?? null,
                ],
                'is_from_me' => true
            ];

            // Log before broadcasting
            Log::info('Broadcasting new message event', [
                'message_id' => $message->id,
                'sender_id' => $message->sender_id,
                'receiver_id' => $message->receiver_id,
                'channel' => 'chat',
                'event' => 'message.new'
            ]);

            // Broadcast the message without toOthers() to ensure both sender and receiver get it
            broadcast(new NewDirectMessage($message, $messageData));

            return response()->json([
                'status' => 'success',
                'message' => 'Message sent successfully',
                'data' => $messageData
            ]);
        } catch (\Exception $e) {
            Log::error('Error sending message: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to send message: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display a single message.
     */
    public function show($message)
    {
        // Not implemented yet
        return response()->json(['message' => 'Not implemented']);
    }

    /**
     * Update a message.
     */
    public function update(Request $request, $message)
    {
        // Not implemented yet
        return response()->json(['message' => 'Not implemented']);
    }

    /**
     * Delete a message.
     */
    public function destroy($id)
    {
        try {
            $message = DirectMessage::findOrFail($id);

            // Check if user is authorized to delete this message
            if ($message->sender_id !== Auth::id() && $message->receiver_id !== Auth::id()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized to delete this message'
                ], 403);
            }

            // Prepare data for broadcasting before deleting
            $messageData = [
                'id' => $message->id,
                'sender_id' => $message->sender_id,
                'receiver_id' => $message->receiver_id,
                'deleted_by' => Auth::id(),
                'deleted_at' => now()
            ];

            // Soft delete the message
            $message->delete();

            // Broadcast the deletion without toOthers() to ensure both sender and receiver get it
            broadcast(new MessageDeleted($message, $messageData));

            return response()->json([
                'status' => 'success',
                'message' => 'Message deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting message: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete message: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark messages as read
     */
    public function markAsRead(Request $request, $userId)
    {
        $currentUser = auth()->user();

        DirectMessage::where('sender_id', $userId)
            ->where('receiver_id', $currentUser->id)
            ->where('read', false)
            ->update(['read' => true]);

        return response()->json(['success' => true]);
    }
}
