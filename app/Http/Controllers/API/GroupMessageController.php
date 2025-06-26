<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\GroupMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Events\NewGroupMessage;
use App\Events\GroupMessageDeleted;

class GroupMessageController extends Controller
{
    /**
     * Get messages for a group.
     */
    public function index(Request $request, Group $group)
    {
        // Check if user is a member of the group
        if (!$group->members()->where('user_id', auth()->id())->exists()) {
            return response()->json(['error' => 'You are not a member of this group'], 403);
        }

        $messages = GroupMessage::where('group_id', $group->id)
            ->with('user:id,name,avatar')
            ->orderBy('created_at', 'asc')
            ->take(100)
            ->get()
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'content' => $message->message,
                    'message' => $message->message,
                    'sender_id' => $message->user_id,
                    'user_id' => $message->user_id,
                    'group_id' => $message->group_id,
                    'created_at' => $message->created_at,
                    'timestamp' => $message->created_at->format('g:i A'),
                    'date' => $message->created_at->format('M j, Y'),
                    'user' => $message->user,
                    'is_from_me' => $message->user_id === auth()->id(),
                ];
            });

        return response()->json([
            'messages' => $messages,
            'group' => [
                'id' => $group->id,
                'name' => $group->name,
                'avatar' => $group->avatar,
                'member_count' => $group->members()->count(),
            ]
        ]);
    }

    /**
     * Store a new message.
     */
    public function store(Request $request, Group $group)
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
            $message = GroupMessage::create([
                'group_id' => $group->id,
                'user_id' => auth()->id(),
                'message' => $validated['message'],
            ]);

            $message->load('user:id,name,avatar');

            // Format the message data for broadcasting
            $messageData = [
                'id' => $message->id,
                'content' => $message->message,
                'message' => $message->message,
                'group_id' => $group->id,
                'user_id' => $message->user_id,
                'sender_id' => $message->user_id,
                'timestamp' => $message->created_at->format('g:i A'),
                'date' => $message->created_at->format('M j, Y'),
                'created_at' => $message->created_at,
                'user' => [
                    'id' => $message->user->id,
                    'name' => $message->user->name,
                    'avatar' => $message->user->avatar
                ]
            ];

            // Log the message creation for debugging
            Log::info('Group message created', [
                'group_id' => $group->id,
                'message_id' => $message->id,
                'user_id' => auth()->id()
            ]);

            // Broadcast event for real-time updates
            event(new NewGroupMessage($group->id, $messageData));

            return response()->json($messageData, 201);
        } catch (\Exception $e) {
            Log::error('Error creating group message', [
                'error' => $e->getMessage(),
                'group_id' => $group->id,
                'user_id' => auth()->id()
            ]);

            return response()->json(['error' => 'Failed to create message: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete a message.
     */
    public function destroy(Group $group, $messageId)
    {
        // Check if user is a member of the group
        if (!$group->members()->where('user_id', auth()->id())->exists()) {
            return response()->json(['error' => 'You are not a member of this group'], 403);
        }

        $message = GroupMessage::where('id', $messageId)
            ->where('group_id', $group->id)
            ->first();

        if (!$message) {
            return response()->json(['error' => 'Message not found'], 404);
        }

        // Check if the user is the sender of the message or a group admin
        if ($message->user_id !== auth()->id() && !$group->members()->where('user_id', auth()->id())->where('role', 'admin')->exists()) {
            return response()->json(['error' => 'You cannot delete this message'], 403);
        }

        $message->delete();

        // Broadcast deletion event
        event(new GroupMessageDeleted($messageId, [
            'id' => $messageId,
            'group_id' => $group->id,
            'deleted_by' => auth()->id()
        ]));

        return response()->json(['success' => true]);
    }

    /**
     * Mark all messages in a group as read.
     */
    public function markAsRead(Group $group)
    {
        // Not implemented yet - would require a GroupMessageRead table
        return response()->json(['success' => true]);
    }
}
