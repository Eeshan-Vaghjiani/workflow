<?php

namespace App\Http\Controllers;

use App\Models\DirectMessage;
use App\Models\Group;
use App\Models\GroupChatMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Events\NewDirectMessage;
use App\Events\NewGroupMessage;
use App\Events\MessageDeleted;
use App\Events\UserTyping;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    /**
     * Display the chat interface with the list of chats.
     */
    public function index()
    {
        $currentUserId = auth()->id();

        return Inertia::render('Chat/ChatWrapper', [
            'currentUserId' => $currentUserId,
        ]);
    }

    /**
     * Display direct messages view with a specific user.
     */
    public function directMessages(Request $request)
    {
        $user = auth()->user();
        $users = User::where('id', '!=', $user->id)->get(['id', 'name', 'avatar', 'status']);

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
            ->values();

        return response()->json([
            'conversations' => $conversations,
            'users' => $users,
        ]);
    }

    /**
     * Get messages for a direct message conversation with a specific user.
     */
    public function getDirectMessages(Request $request, User $user)
    {
        $currentUser = auth()->user();

        $messages = DirectMessage::where(function ($query) use ($currentUser, $user) {
                $query->where('sender_id', $currentUser->id)
                    ->where('receiver_id', $user->id);
            })
            ->orWhere(function ($query) use ($currentUser, $user) {
                $query->where('sender_id', $user->id)
                    ->where('receiver_id', $currentUser->id);
            })
            ->with('sender:id,name,avatar')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($message) use ($currentUser) {
                return [
                    'id' => $message->id,
                    'content' => $message->message,
                    'timestamp' => $message->created_at->format('g:i A'),
                    'date' => $message->created_at->format('M j, Y'),
                    'is_from_me' => $message->sender_id == $currentUser->id,
                    'sender' => $message->sender,
                ];
            });

        // Mark all messages from this user as read
        DirectMessage::where('sender_id', $user->id)
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
    }

    /**
     * Display group chat view.
     */
    public function groupChat(Group $group)
    {
        // Check if user is a member of the group
        if (!$group->members()->where('user_id', auth()->id())->exists()) {
            abort(403, 'You are not a member of this group');
        }

        $messages = $group->chatMessages()
            ->with('user:id,name,avatar')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'content' => $message->message,
                    'sender' => $message->user,
                    'timestamp' => $message->created_at->format('g:i A'),
                    'date' => $message->created_at->format('M j, Y'),
                    'is_system_message' => $message->is_system_message,
                ];
            });

        $groupData = [
            'id' => $group->id,
            'name' => $group->name,
            'description' => $group->description,
            'avatar' => $group->avatar,
            'members' => $group->members->map(function ($member) {
                return [
                    'id' => $member->id,
                    'name' => $member->name,
                    'avatar' => $member->avatar,
                    'role' => $member->pivot->role,
                ];
            }),
            'messages' => $messages,
        ];

        return response()->json($groupData);
    }

    /**
     * Send a direct message to a user.
     */
    public function sendDirectMessage(Request $request, User $user)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $message = DirectMessage::create([
            'sender_id' => auth()->id(),
            'receiver_id' => $user->id,
            'message' => $validated['message'],
            'read' => false,
        ]);

        $message->load('sender:id,name,avatar');

        $messageData = [
            'id' => $message->id,
            'content' => $message->message,
            'timestamp' => $message->created_at->format('g:i A'),
            'date' => $message->created_at->format('M j, Y'),
            'is_from_me' => true,
            'sender' => $message->sender,
        ];

        // Broadcast the message
        broadcast(new NewDirectMessage($message, $messageData))->toOthers();

        return response()->json($messageData);
    }

    /**
     * Send a message to a group chat.
     */
    public function sendGroupMessage(Request $request, Group $group)
    {
        // Check if user is a member of the group
        if (!$group->members()->where('user_id', auth()->id())->exists()) {
            abort(403, 'You are not a member of this group');
        }

        $validated = $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $message = GroupChatMessage::create([
            'group_id' => $group->id,
            'user_id' => auth()->id(),
            'message' => $validated['message'],
            'is_system_message' => false,
        ]);

        // Load the user relationship
        $message->load('user:id,name,avatar');

        $messageData = [
            'id' => $message->id,
            'content' => $message->message,
            'sender' => $message->user,
            'timestamp' => $message->created_at->format('g:i A'),
            'date' => $message->created_at->format('M j, Y'),
            'is_system_message' => false,
        ];

        // Broadcast the message
        broadcast(new NewGroupMessage($group->id, $messageData))->toOthers();

        return response()->json($messageData);
    }

    /**
     * Get a list of contacts for chat (all users except the current user).
     */
    public function getContacts()
    {
        $users = User::where('id', '!=', auth()->id())
            ->get(['id', 'name', 'avatar', 'status']);

        return response()->json($users);
    }

    /**
     * Get all chat groups the user is a member of.
     */
    public function getGroups()
    {
        $user = auth()->user();

        $groups = $user->groups()
            ->get()
            ->map(function ($group) {
                // Get the latest message for each group
                $latestMessage = $group->chatMessages()
                    ->with('user:id,name')
                    ->latest()
                    ->first();

                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'description' => $group->description,
                    'avatar' => $group->avatar,
                    'lastMessage' => $latestMessage ? [
                        'content' => $latestMessage->message,
                        'sender' => $latestMessage->is_system_message ? 'System' : $latestMessage->user->name,
                        'timestamp' => $latestMessage->created_at->format('g:i A'),
                        'date' => $latestMessage->created_at->format('M j, Y'),
                    ] : null,
                    'memberCount' => $group->members()->count(),
                ];
            });

        return response()->json($groups);
    }

    /**
     * Search for users by name.
     */
    public function searchUsers(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|min:2',
            ]);

            $term = $validated['name'];
            $currentUserId = auth()->id();

            \Log::info('Chat user search request', [
                'term' => $term,
                'authenticated_user' => $currentUserId,
                'request_path' => $request->path(),
                'request_url' => $request->url(),
            ]);

            // Make search more lenient by checking multiple columns and using lowercase
            $users = User::where('id', '!=', $currentUserId)
                ->where(function($query) use ($term) {
                    $query->where('name', 'LIKE', '%' . $term . '%')
                          ->orWhere('email', 'LIKE', '%' . $term . '%');
                })
                ->select('id', 'name', 'email', 'avatar')
                ->take(10)
                ->get();

            // Log the search results for debugging
            \Log::info('User search results', [
                'term' => $term,
                'count' => $users->count(),
                'users' => $users->pluck('name', 'id')->toArray()
            ]);

            return response()->json($users);
        } catch (\Exception $e) {
            \Log::error('Error in chat user search', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Failed to search for users',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a message.
     */
    public function deleteMessage($id)
    {
        try {
            // Handle temporary IDs from frontend
            if (is_string($id) && strpos($id, 'temp-') === 0) {
                return response()->json([
                    'success' => true,
                    'message' => 'Temporary message removed from UI only',
                    'id' => $id
                ]);
            }

            $currentUser = auth()->user();

            // Try to find direct message first
            $message = DirectMessage::find($id);

            if ($message) {
                // Check if user is authorized to delete this message
                if ($message->sender_id !== $currentUser->id && $message->receiver_id !== $currentUser->id) {
                    return response()->json([
                        'error' => 'Unauthorized to delete this message',
                    ], 403);
                }

                // Prepare data for broadcasting
                $messageData = [
                    'id' => $message->id,
                    'sender_id' => $message->sender_id,
                    'receiver_id' => $message->receiver_id,
                    'deleted_by' => $currentUser->id,
                    'deleted_at' => now()
                ];

                // Soft delete the message
                $message->delete();

                // Broadcast deletion event
                broadcast(new MessageDeleted($message, $messageData));

                return response()->json([
                    'success' => true,
                    'message' => 'Message deleted successfully',
                    'id' => $id
                ]);
            }

            // If not found as direct message, try group message
            $groupMessage = GroupChatMessage::find($id);

            if ($groupMessage) {
                // Check if user is authorized to delete this message
                $group = Group::find($groupMessage->group_id);
                $isAdmin = $group->members()->where('user_id', $currentUser->id)->where('is_admin', true)->exists();

                if ($groupMessage->user_id !== $currentUser->id && !$isAdmin) {
                    return response()->json([
                        'error' => 'Unauthorized to delete this message',
                    ], 403);
                }

                // Prepare data for broadcasting
                $messageData = [
                    'id' => $groupMessage->id,
                    'group_id' => $groupMessage->group_id,
                    'user_id' => $groupMessage->user_id,
                    'deleted_by' => $currentUser->id,
                    'deleted_at' => now()
                ];

                // Soft delete the message
                $groupMessage->delete();

                // Broadcast deletion event
                broadcast(new MessageDeleted($groupMessage, $messageData));

                return response()->json([
                    'success' => true,
                    'message' => 'Message deleted successfully',
                    'id' => $id
                ]);
            }

            // Message not found
            return response()->json([
                'error' => 'Message not found',
            ], 404);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error deleting message', [
                'id' => $id,
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
     * Delete a group message.
     */
    public function deleteGroupMessage($id)
    {
        try {
            // Handle temporary IDs from frontend
            if (is_string($id) && strpos($id, 'temp-') === 0) {
                return response()->json([
                    'success' => true,
                    'message' => 'Temporary message removed from UI only',
                    'id' => $id
                ]);
            }

            $currentUser = auth()->user();

            // Find the message
            $message = GroupChatMessage::find($id);

            // Check if message exists
            if (!$message) {
                return response()->json([
                    'error' => 'Message not found',
                ], 404);
            }

            // Check if the user is authorized to delete this message
            $group = Group::find($message->group_id);
            $isAdmin = $group->members()->where('user_id', $currentUser->id)->where('is_admin', true)->exists();

            if ($message->user_id !== $currentUser->id && !$isAdmin) {
                return response()->json([
                    'error' => 'Unauthorized to delete this message',
                ], 403);
            }

            // Prepare data for broadcasting
            $messageData = [
                'id' => $message->id,
                'group_id' => $message->group_id,
                'user_id' => $message->user_id,
                'deleted_by' => $currentUser->id,
                'deleted_at' => now()
            ];

            // Soft delete the message
            $message->delete();

            // Broadcast deletion event
            broadcast(new MessageDeleted($message, $messageData));

            return response()->json([
                'success' => true,
                'message' => 'Message deleted successfully',
                'id' => $id
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error deleting group message', [
                'id' => $id,
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
     * Handle typing indicator.
     */
    public function typing(Request $request)
    {
        try {
            // Validate request
            $validated = $request->validate([
                'receiver_id' => 'required_without:group_id|nullable|integer',
                'group_id' => 'required_without:receiver_id|nullable|integer',
                'is_typing' => 'required|boolean',
            ]);

            $currentUser = auth()->user();

            // Determine if this is a direct message or group message
            $isDirectMessage = isset($validated['receiver_id']);

            if ($isDirectMessage) {
                // Check if the recipient exists
                $recipient = User::find($validated['receiver_id']);
                if (!$recipient) {
                    return response()->json([
                        'error' => 'Recipient not found',
                    ], 404);
                }

                // Broadcast typing indicator for direct message
                $typingData = [
                    'user_id' => $currentUser->id,
                    'user_name' => $currentUser->name,
                    'receiver_id' => $validated['receiver_id'],
                    'is_typing' => $validated['is_typing'],
                    'timestamp' => now()->toIso8601String()
                ];

                broadcast(new UserTyping($typingData));
            } else {
                // Check if the group exists and user is a member
                $group = Group::find($validated['group_id']);
                if (!$group) {
                    return response()->json([
                        'error' => 'Group not found',
                    ], 404);
                }

                if (!$group->members()->where('user_id', $currentUser->id)->exists()) {
                    return response()->json([
                        'error' => 'You are not a member of this group',
                    ], 403);
                }

                // Broadcast typing indicator for group chat
                $typingData = [
                    'user_id' => $currentUser->id,
                    'user_name' => $currentUser->name,
                    'group_id' => $validated['group_id'],
                    'is_typing' => $validated['is_typing'],
                    'timestamp' => now()->toIso8601String()
                ];

                broadcast(new UserTyping($typingData));
            }

            return response()->json([
                'success' => true,
                'message' => 'Typing indicator sent',
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error sending typing indicator', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Failed to send typing indicator',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
