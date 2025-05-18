<?php

namespace App\Http\Controllers;

use App\Models\DirectMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Events\NewDirectMessage;

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
     * Send a direct message to a user.
     */
    public function store(Request $request, $userId)
    {
        try {
            $validated = $request->validate([
                'message' => 'required|string|max:1000',
            ]);
            
            $currentUser = auth()->user();
            $userId = (int) $userId;
            
            // Check if user exists
            $receiver = User::find($userId);
            if (!$receiver) {
                Log::error('Attempted to send message to non-existent user', [
                    'receiver_id' => $userId,
                    'sender_id' => $currentUser->id
                ]);
                
                return response()->json([
                    'error' => 'User not found',
                    'user_id' => $userId
                ], 404);
            }
            
            // Create the message
            $message = DirectMessage::create([
                'sender_id' => $currentUser->id,
                'receiver_id' => $userId,
                'message' => $validated['message'],
                'read' => false,
            ]);
            
            // Load sender relationship
            $message->load('sender:id,name,avatar');
            
            // Format for response
            $messageData = [
                'id' => $message->id,
                'content' => $message->message,
                'message' => $message->message,
                'timestamp' => $message->created_at->format('g:i A'),
                'date' => $message->created_at->format('M j, Y'),
                'created_at' => $message->created_at,
                'is_from_me' => true,
                'user_id' => $currentUser->id,
                'user' => $message->sender,
            ];
            
            // Broadcast the message
            broadcast(new NewDirectMessage($message, $messageData))->toOthers();
            
            Log::info('Direct message sent', [
                'sender_id' => $currentUser->id,
                'receiver_id' => $userId,
                'message_id' => $message->id
            ]);
            
            return response()->json($messageData);
        } catch (\Exception $e) {
            Log::error('Error sending direct message', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Failed to send message',
                'message' => $e->getMessage()
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
    public function destroy($message)
    {
        // Not implemented yet
        return response()->json(['message' => 'Not implemented']);
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