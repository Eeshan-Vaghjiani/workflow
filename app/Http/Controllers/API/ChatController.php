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
     * Search for users by name.
     */
    public function searchUsers(Request $request)
    {
        try {
            // First check authentication status
            if (!auth()->check()) {
                Log::error('API Chat search attempted without authentication');
                return response()->json([
                    'error' => 'Authentication required',
                    'message' => 'You must be logged in to use this feature',
                ], 401);
            }

            Log::info('Search users request received', [
                'request' => $request->all(),
                'auth' => 'Authenticated user: ' . auth()->id(),
                'user_id' => auth()->id(),
                'headers' => array_keys($request->headers->all()),
                'session_id' => $request->session()->getId()
            ]);

            // Check if we have a name parameter at all
            if (!$request->has('name')) {
                Log::warning('Search users request missing name parameter');
                return response()->json([
                    'error' => 'Missing name parameter',
                    'debug_info' => [
                        'request_params' => $request->all(),
                        'name_param' => $request->name
                    ]
                ], 400);
            }

            // Use a more lenient validation
            $term = trim($request->input('name'));

            if (empty($term) || strlen($term) < 2) {
                Log::warning('Search term too short', ['term' => $term]);
                return response()->json([
                    'error' => 'Search term must be at least 2 characters',
                    'term' => $term,
                    'term_length' => strlen($term)
                ], 400);
            }

            $currentUserId = auth()->id();

            Log::info('API Chat user search request', [
                'term' => $term,
                'authenticated_user' => $currentUserId,
                'request_path' => $request->path(),
                'request_url' => $request->url(),
            ]);

            // First do a simple count query to see how many users exist total
            $totalUserCount = User::count();
            $usersExceptCurrentCount = User::where('id', '!=', $currentUserId)->count();

            Log::info('Database user counts', [
                'total_users' => $totalUserCount,
                'users_except_current' => $usersExceptCurrentCount
            ]);

            // Make search more lenient by checking multiple columns and using lowercase
            $query = User::query();

            if (auth()->check()) {
                $query->where('id', '!=', $currentUserId);
            }

            $query->where(function($q) use ($term) {
                $q->where('name', 'LIKE', "%{$term}%")
                  ->orWhere('email', 'LIKE', "%{$term}%");
            });

            // Log the raw SQL query for debugging
            $querySql = $query->toSql();
            $queryBindings = $query->getBindings();

            Log::info('User search query', [
                'query' => $querySql,
                'bindings' => $queryBindings
            ]);

            $users = $query->select('id', 'name', 'email', 'avatar')
                ->take(10)
                ->get();

            // Log the search results for debugging
            Log::info('API User search results', [
                'term' => $term,
                'count' => $users->count(),
                'users' => $users->isEmpty() ? 'No users found' : $users->pluck('name', 'id')->toArray()
            ]);

            return response()->json($users);
        } catch (\Exception $e) {
            Log::error('Error in API chat user search', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ]);

            return response()->json([
                'error' => 'Failed to search for users',
                'message' => $e->getMessage(),
                'debug_info' => [
                    'line' => $e->getLine(),
                    'file' => basename($e->getFile())
                ]
            ], 500);
        }
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
}
