<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\GroupMessage;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
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
            ->with(['user:id,name,avatar', 'attachments'])
            ->orderBy('created_at', 'asc')
            ->take(100)
            ->get()
            ->map(function ($message) {
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
                    'sender_id' => $message->user_id,
                    'user_id' => $message->user_id,
                    'group_id' => $message->group_id,
                    'created_at' => $message->created_at,
                    'timestamp' => $message->created_at->format('g:i A'),
                    'date' => $message->created_at->format('M j, Y'),
                    'user' => $message->user,
                    'attachments' => $attachmentData,
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
            'message' => 'nullable|string|max:1000',
            'attachments' => 'nullable|array|max:5',
            'attachments.*' => 'file|max:10240', // 10MB max per file
        ]);

        // Must have either message or attachments
        if (empty($validated['message']) && empty($validated['attachments'])) {
            return response()->json([
                'error' => 'Message or attachments required'
            ], 400);
        }

        try {
            // Create the message
            $message = GroupMessage::create([
                'group_id' => $group->id,
                'user_id' => auth()->id(),
                'message' => $validated['message'] ?? '',
            ]);

            // Handle attachments
            $attachmentData = [];
            if (!empty($validated['attachments'])) {
                foreach ($validated['attachments'] as $file) {
                    $filename = time() . '_' . $file->getClientOriginalName();
                    $path = $file->storeAs('message-attachments', $filename, 'public');
                    
                    $attachment = MessageAttachment::create([
                        'message_id' => $message->id,
                        'message_type' => 'group',
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
                'attachments' => $attachmentData,
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
                'user_id' => auth()->id(),
                'attachments_count' => count($attachmentData)
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
     * Upload attachment for a group message
     */
    public function uploadAttachment(Request $request, Group $group)
    {
        // Check if user is a member of the group
        if (!$group->members()->where('user_id', auth()->id())->exists()) {
            return response()->json(['error' => 'You are not a member of this group'], 403);
        }

        try {
            $validated = $request->validate([
                'file' => 'required|file|max:10240', // 10MB max
            ]);

            $currentUser = auth()->user();

            // Store the file
            $file = $request->file('file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('message-attachments', $filename, 'public');

            // Create a message with just the attachment
            $message = GroupMessage::create([
                'group_id' => $group->id,
                'user_id' => $currentUser->id,
                'message' => '', // Empty message for attachment-only
            ]);

            // Create the attachment record
            $attachment = MessageAttachment::create([
                'message_id' => $message->id,
                'message_type' => 'group',
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

            // Load user relationship
            $message->load('user:id,name,avatar');

            $messageData = [
                'id' => $message->id,
                'content' => '',
                'message' => '',
                'group_id' => $group->id,
                'user_id' => $message->user_id,
                'sender_id' => $message->user_id,
                'timestamp' => $message->created_at->format('g:i A'),
                'date' => $message->created_at->format('M j, Y'),
                'created_at' => $message->created_at,
                'attachments' => [$attachmentData],
                'user' => [
                    'id' => $message->user->id,
                    'name' => $message->user->name,
                    'avatar' => $message->user->avatar
                ]
            ];

            // Broadcast the message
            event(new NewGroupMessage($group->id, $messageData));

            return response()->json([
                'message' => $messageData,
                'attachment' => $attachmentData
            ]);

        } catch (\Exception $e) {
            Log::error('Error uploading group attachment', [
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
