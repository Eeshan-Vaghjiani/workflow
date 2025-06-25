<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\GroupChatMessage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GroupChatController extends Controller
{
    /**
     * Display the chat index.
     */
    public function index()
    {
        $user = auth()->user();
        $groups = Group::whereHas('members', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->get();

        return Inertia::render('Chat/Index', [
            'groups' => $groups
        ]);
    }

    /**
     * Display the chat for a specific group.
     */
    public function show(Group $group)
    {
        // Check if user is a member of the group
        if (!$group->members()->where('user_id', auth()->id())->exists()) {
            abort(403, 'You are not a member of this group');
        }

        $messages = GroupChatMessage::where('group_id', $group->id)
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get();

        return Inertia::render('Chat/Show', [
            'group' => $group,
            'messages' => $messages
        ]);
    }

    /**
     * Get messages for a specific group.
     */
    public function getMessages(Group $group)
    {
        // Check if user is a member of the group
        if (!$group->members()->where('user_id', auth()->id())->exists()) {
            abort(403, 'You are not a member of this group');
        }

        $messages = GroupChatMessage::where('group_id', $group->id)
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get();

        return Inertia::render('Chat/Messages', [
            'messages' => $messages
        ]);
    }

    /**
     * Store a new message.
     */
    public function store(Request $request, Group $group)
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

        $message->load('user:id,name');

        return Inertia::render('Chat/MessageCreated', [
            'newMessage' => $message
        ]);
    }

    /**
     * Get messages for a specific group via API.
     */
    public function getMessagesAPI(Group $group)
    {
        // Check if user is a member of the group
        if (!$group->members()->where('user_id', auth()->id())->exists()) {
            return response()->json(['error' => 'You are not a member of this group'], 403);
        }

        $messages = GroupChatMessage::where('group_id', $group->id)
            ->with('user:id,name,avatar')
            ->orderBy('created_at', 'asc')
            ->take(50)
            ->get();

        return response()->json($messages);
    }

    /**
     * Store a new message via API.
     */
    public function storeAPI(Request $request, Group $group)
    {
        // Check if user is a member of the group
        if (!$group->members()->where('user_id', auth()->id())->exists()) {
            return response()->json(['error' => 'You are not a member of this group'], 403);
        }

        $validated = $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        try {
            // Create the message
            $message = GroupChatMessage::create([
                'group_id' => $group->id,
                'user_id' => auth()->id(),
                'message' => $validated['message'],
                'is_system_message' => false,
            ]);

            $message->load('user:id,name,avatar');

            // Format the message data for broadcasting
            $messageData = [
                'id' => $message->id,
                'content' => $message->message,
                'message' => $message->message,
                'group_id' => $group->id,
                'user_id' => $message->user->id,
                'sender_id' => $message->user->id,
                'timestamp' => $message->created_at->format('g:i A'),
                'date' => $message->created_at->format('M j, Y'),
                'created_at' => $message->created_at,
                'user' => [
                    'id' => $message->user->id,
                    'name' => $message->user->name,
                    'avatar' => $message->user->avatar
                ],
                'is_system_message' => $message->is_system_message
            ];

            // Log the message creation for debugging
            \Illuminate\Support\Facades\Log::info('Group message created', [
                'group_id' => $group->id,
                'message_id' => $message->id,
                'user_id' => auth()->id()
            ]);

            // Broadcast event for real-time updates
            event(new \App\Events\NewGroupMessage($group->id, $messageData));

            return response()->json($messageData, 201);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error creating group message', [
                'error' => $e->getMessage(),
                'group_id' => $group->id,
                'user_id' => auth()->id()
            ]);

            return response()->json(['error' => 'Failed to create message: ' . $e->getMessage()], 500);
        }
    }
}
