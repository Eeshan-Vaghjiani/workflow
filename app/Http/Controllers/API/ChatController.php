<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\DirectMessage;
use App\Models\Group;
use App\Models\GroupChatMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
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
     * Search for users to start a conversation with
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function searchUsers(Request $request)
    {
        $query = $request->input('query');

        if (empty($query)) {
            return response()->json([]);
        }

        $users = \App\Models\User::where('id', '!=', auth()->id())
            ->where(function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('email', 'like', "%{$query}%");
            })
            ->select('id', 'name', 'email', 'avatar', 'status')
            ->limit(10)
            ->get();

        return response()->json($users);
    }

    /**
     * Get all direct message conversations for the current user.
     */
    public function getDirectMessages()
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
     * Test API authentication
     */
    public function testAuth(Request $request)
    {
        if (auth()->check()) {
            return response()->json([
                'authenticated' => true,
                'user' => [
                    'id' => auth()->id(),
                    'name' => auth()->user()->name,
                    'email' => auth()->user()->email,
                ],
                'session' => [
                    'id' => $request->session()->getId(),
                    'has_token' => $request->session()->has('_token'),
                ],
                'headers' => [
                    'names' => array_keys($request->headers->all()),
                    'has_csrf' => $request->hasHeader('X-CSRF-TOKEN'),
                    'csrf' => $request->header('X-CSRF-TOKEN'),
                ],
            ]);
        } else {
            return response()->json([
                'authenticated' => false,
                'session' => [
                    'has_session' => $request->hasSession(),
                    'session_id' => $request->hasSession() ? $request->session()->getId() : null,
                ],
                'debug' => [
                    'headers' => array_keys($request->headers->all()),
                    'cookies' => $request->cookies->all(),
                ]
            ], 401);
        }
    }

    /**
     * Test broadcasting with Pusher
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function testBroadcast(Request $request)
    {
        try {
            $testMessage = $request->input('message', 'Test message from ChatController at ' . now());

            $user = auth()->user();
            $userId = $user ? $user->id : 1;

            $data = [
                'message' => $testMessage,
                'content' => $testMessage,
                'timestamp' => now()->format('g:i A'),
                'date' => now()->format('M j, Y'),
                'created_at' => now(),
                'user' => [
                    'id' => $userId,
                    'name' => $user ? $user->name : 'Test User',
                    'avatar' => $user ? $user->avatar : null
                ]
            ];

            // Create a temporary message for testing
            $message = new \App\Models\DirectMessage([
                'id' => 9999,
                'sender_id' => $userId,
                'receiver_id' => $userId,
                'message' => $testMessage,
                'created_at' => now()
            ]);

            // Log before broadcast
            \Illuminate\Support\Facades\Log::info('Broadcasting test message', [
                'data' => $data,
                'channel' => 'chat',
                'event' => 'message.new'
            ]);

            // Broadcast the event
            broadcast(new \App\Events\NewDirectMessage($message, $data))->toOthers();

            return response()->json([
                'success' => true,
                'message' => 'Test broadcast sent',
                'data' => $data,
                'time' => now()
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error in test broadcast', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
