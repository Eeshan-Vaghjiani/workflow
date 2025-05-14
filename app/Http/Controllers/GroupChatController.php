<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\GroupMessage;
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

        $messages = GroupMessage::where('group_id', $group->id)
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

        $messages = GroupMessage::where('group_id', $group->id)
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

        $message = GroupMessage::create([
            'group_id' => $group->id,
            'user_id' => auth()->id(),
            'message' => $validated['message'],
        ]);

        $message->load('user:id,name');

        return Inertia::render('Chat/MessageCreated', [
            'newMessage' => $message
        ]);
    }
} 