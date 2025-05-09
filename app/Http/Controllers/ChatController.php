<?php

namespace App\Http\Controllers;

use App\Models\DirectMessage;
use App\Models\Group;
use App\Models\GroupChatMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ChatController extends Controller
{
    /**
     * Display the chat interface with the list of chats.
     */
    public function index()
    {
        $currentUserId = auth()->id();
        
        return Inertia::render('Chat/Index', [
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
        
        return response()->json([
            'id' => $message->id,
            'content' => $message->message,
            'timestamp' => $message->created_at->format('g:i A'),
            'date' => $message->created_at->format('M j, Y'),
            'is_from_me' => true,
        ]);
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
        
        return response()->json([
            'id' => $message->id,
            'content' => $message->message,
            'sender' => $message->user,
            'timestamp' => $message->created_at->format('g:i A'),
            'date' => $message->created_at->format('M j, Y'),
            'is_system_message' => false,
        ]);
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
} 