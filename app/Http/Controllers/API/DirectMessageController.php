<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\DirectMessage;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Events\NewDirectMessage;
use App\Events\MessageDeleted;

class DirectMessageController extends Controller
{
    /**
     * Get all direct message conversations for the current user.
     */
    public function index()
    {
        $user = auth()->user();

        // Get all direct message conversations
        $conversations = DirectMessage::where('sender_id', $user->id)
            ->orWhere('receiver_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy(function ($message) use ($user) {
                return $message->sender_id == $user->id
                    ? $message->receiver_id
                    : $message->sender_id;
            })
            ->map(function ($messages, $userId) use ($user) {
                $otherUser = User::find($userId);

                if (!$otherUser) {
                    Log::warning('Missing user in direct message conversation', [
                        'user_id' => $userId,
                        'auth_user' => $user->id
                    ]);
                    return null;
                }

                $lastMessage = $messages->sortByDesc('created_at')->first();

                return [
                    'user' => [
                        'id' => $otherUser->id,
                        'name' => $otherUser->name,
                        'avatar' => $otherUser->avatar,
                        'status' => $otherUser->status ?? 'offline',
                    ],
                    'lastMessage' => [
                        'content' => $lastMessage->message,
                        'timestamp' => $lastMessage->created_at->format('g:i A'),
                        'date' => $lastMessage->created_at->format('M j, Y'),
                        'is_read' => $lastMessage->read,
                        'is_from_me' => $lastMessage->sender_id == $user->id,
                    ],
                    'unreadCount' => $messages->where('receiver_id', $user->id)
                        ->where('read', false)
                        ->count(),
                ];
            })
            ->filter()
            ->values();

        return response()->json([
            'conversations' => $conversations,
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
                'other_user' => $userId
            ]);

            $messages = DirectMessage::where(function ($query) use ($currentUser, $userId) {
                    $query->where('sender_id', $currentUser->id)
                        ->where('receiver_id', $userId);
                })
                ->orWhere(function ($query) use ($currentUser, $userId) {
                    $query->where('sender_id', $userId)
                        ->where('receiver_id', $currentUser->id);
                })
                ->with(['sender:id,name,avatar', 'attachments'])
                ->orderBy('created_at', 'asc')
                ->get()
                ->map(function ($message) use ($currentUser) {
                    $attachmentData = $message->attachments->map(function ($attachment) {
                        return [
                            'id' => $attachment->id,
                            'file_name' => $attachment->file_name,
                            'file_type' => $attachment->file_type,
                            'file_size' => $attachment->file_size,
                            'file_url' => Storage::url($attachment->file_path),
                        ];
                    });

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
                        'attachments' => $attachmentData,
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
                'trace' => $e->getTraceAsString()
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
                'message' => 'nullable|string|max:1000',
                'attachments' => 'nullable|array|max:5',
                'attachments.*' => 'file|max:10240', // 10MB max per file
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

            // Must have either message or attachments
            if (empty($validated['message']) && empty($validated['attachments'])) {
                return response()->json([
                    'error' => 'Message or attachments required'
                ], 400);
            }

            // Create the message
            $message = DirectMessage::create([
                'sender_id' => $currentUser->id,
                'receiver_id' => $userId,
                'message' => $validated['message'] ?? '',
                'read' => false,
            ]);

            // Handle attachments
            $attachmentData = [];
            if (!empty($validated['attachments'])) {
                foreach ($validated['attachments'] as $file) {
                    $filename = time() . '_' . $file->getClientOriginalName();
                    $path = $file->storeAs('message-attachments', $filename, 'public');
                    
                    $attachment = MessageAttachment::create([
                        'message_id' => $message->id,
                        'message_type' => 'direct',
                        'file_path' => $path,
                        'file_name' => $file->getClientOriginalName(),
                        'file_type' => $file->getMimeType(),
                        'file_size' => $file->getSize(),
                    ]);

                    $attachmentData[] = [
                        'id' => $attachment->id,
                        'file_name' => $attachment->file_name,
                        'file_type' => $attachment->file_type,
                        'file_size' => $attachment->file_size,
                        'file_url' => Storage::url($attachment->file_path),
                    ];
                }
            }

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
                'is_from_me' => false,
                'user_id' => $currentUser->id,
                'sender_id' => $currentUser->id,
                'receiver_id' => $userId,
                'attachments' => $attachmentData,
                'user' => [
                    'id' => $currentUser->id,
                    'name' => $currentUser->name,
                    'avatar' => $currentUser->avatar
                ],
            ];

            // Detailed logging for message data
            Log::info('Direct message prepared for broadcast', [
                'message_id' => $message->id,
                'sender_id' => $currentUser->id,
                'receiver_id' => $userId,
                'attachments_count' => count($attachmentData),
                'timestamp' => $message->created_at,
            ]);

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
     * Upload attachment for a direct message
     */
    public function uploadAttachment(Request $request)
    {
        try {
            $validated = $request->validate([
                'file' => 'required|file|max:10240', // 10MB max
                'receiver_id' => 'required|exists:users,id',
            ]);

            $currentUser = auth()->user();
            $receiverId = $validated['receiver_id'];

            // Store the file
            $file = $request->file('file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('message-attachments', $filename, 'public');

            // Create a message with just the attachment
            $message = DirectMessage::create([
                'sender_id' => $currentUser->id,
                'receiver_id' => $receiverId,
                'message' => '', // Empty message for attachment-only
                'read' => false,
            ]);

            // Create the attachment record
            $attachment = MessageAttachment::create([
                'message_id' => $message->id,
                'message_type' => 'direct',
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'file_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
            ]);

            // Format response
            $attachmentData = [
                'id' => $attachment->id,
                'file_name' => $attachment->file_name,
                'file_type' => $attachment->file_type,
                'file_size' => $attachment->file_size,
                'file_url' => Storage::url($attachment->file_path),
            ];

            // Load sender relationship
            $message->load('sender:id,name,avatar');

            $messageData = [
                'id' => $message->id,
                'content' => '',
                'message' => '',
                'timestamp' => $message->created_at->format('g:i A'),
                'date' => $message->created_at->format('M j, Y'),
                'created_at' => $message->created_at,
                'is_from_me' => false,
                'user_id' => $currentUser->id,
                'sender_id' => $currentUser->id,
                'receiver_id' => $receiverId,
                'attachments' => [$attachmentData],
                'user' => [
                    'id' => $currentUser->id,
                    'name' => $currentUser->name,
                    'avatar' => $currentUser->avatar
                ],
            ];

            // Broadcast the message
            broadcast(new NewDirectMessage($message, $messageData))->toOthers();

            return response()->json([
                'message' => $messageData,
                'attachment' => $attachmentData
            ]);

        } catch (\Exception $e) {
            Log::error('Error uploading attachment', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Failed to upload attachment',
                'message' => $e->getMessage()
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

    /**
     * Notify user is typing
     */
    public function typing(Request $request, $userId)
    {
        // You can implement real-time typing indicators here
        return response()->json(['success' => true]);
    }

    /**
     * Delete a message.
     */
    public function destroy($id)
    {
        try {
            $message = DirectMessage::findOrFail($id);
            $currentUser = auth()->user();

            // Check if the user is authorized to delete this message
            if ($message->sender_id != $currentUser->id) {
                Log::warning('Unauthorized attempt to delete message', [
                    'user_id' => $currentUser->id,
                    'message_id' => $id,
                    'message_sender' => $message->sender_id
                ]);

                return response()->json([
                    'error' => 'You are not authorized to delete this message'
                ], 403);
            }

            // Instead of deleting, mark as deleted (soft delete)
            $message->deleted_at = now();
            $message->save();

            // Broadcast message deletion event
            broadcast(new MessageDeleted($message->id, 'direct'))->toOthers();

            Log::info('Message soft deleted', [
                'message_id' => $id,
                'user_id' => $currentUser->id
            ]);

            return response()->json([
                'message' => 'Message deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting message', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Failed to delete message',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reply to a direct message
     */
    public function reply(Request $request, $messageId)
    {
        try {
            $validated = $request->validate([
                'message' => 'required|string|max:1000',
            ]);

            $currentUser = auth()->user();

            // Find the original message
            $originalMessage = DirectMessage::findOrFail($messageId);

            // Determine who to send the reply to
            $receiverId = $originalMessage->sender_id == $currentUser->id
                ? $originalMessage->receiver_id
                : $originalMessage->sender_id;

            // Create the reply message
            $message = DirectMessage::create([
                'sender_id' => $currentUser->id,
                'receiver_id' => $receiverId,
                'message' => $validated['message'],
                'parent_id' => $messageId, // Set the parent_id to indicate this is a reply
                'read' => false,
            ]);

            // Load sender relationship
            $message->load('sender:id,name,avatar');
            $message->load('parent'); // Load the parent message

            // Format for response
            $messageData = [
                'id' => $message->id,
                'content' => $message->message,
                'message' => $message->message,
                'timestamp' => $message->created_at->format('g:i A'),
                'date' => $message->created_at->format('M j, Y'),
                'created_at' => $message->created_at,
                'is_from_me' => false,
                'user_id' => $currentUser->id,
                'sender_id' => $currentUser->id,
                'receiver_id' => $receiverId,
                'parent_id' => $messageId,
                'parent' => [
                    'id' => $originalMessage->id,
                    'content' => $originalMessage->message,
                    'sender' => [
                        'id' => $originalMessage->sender_id,
                        'name' => $originalMessage->sender->name,
                    ]
                ],
                'user' => [
                    'id' => $currentUser->id,
                    'name' => $currentUser->name,
                    'avatar' => $currentUser->avatar
                ],
            ];

            // Broadcast the message
            broadcast(new NewDirectMessage($message, $messageData))->toOthers();

            Log::info('Reply message sent', [
                'sender_id' => $currentUser->id,
                'receiver_id' => $receiverId,
                'message_id' => $message->id,
                'parent_id' => $messageId
            ]);

            return response()->json($messageData);
        } catch (\Exception $e) {
            Log::error('Error sending reply message', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Failed to send reply',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
