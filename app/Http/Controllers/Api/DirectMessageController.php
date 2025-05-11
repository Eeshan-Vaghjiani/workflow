<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DirectMessage;
use App\Models\User;
use App\Events\NewMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DirectMessageController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Get all direct message conversations
        $conversations = DirectMessage::where(function ($query) use ($user) {
            $query->where('sender_id', $user->id)
                ->orWhere('receiver_id', $user->id);
        })
            ->with(['sender', 'receiver'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy(function ($message) use ($user) {
                return $message->sender_id === $user->id
                    ? $message->receiver_id
                    : $message->sender_id;
            })
            ->map(function ($messages) use ($user) {
                $otherUser = $messages->first()->sender_id === $user->id
                    ? $messages->first()->receiver
                    : $messages->first()->sender;

                return [
                    'id' => $otherUser->id,
                    'user' => $otherUser,
                    'last_message' => $messages->first()->only(['message', 'created_at']),
                    'unread_count' => $messages->where('receiver_id', $user->id)
                        ->where('read', false)
                        ->count(),
                ];
            })
            ->values();

        return response()->json($conversations);
    }

    public function messages($userId)
    {
        $currentUser = Auth::user();

        $messages = DirectMessage::where(function ($query) use ($currentUser, $userId) {
            $query->where(function ($q) use ($currentUser, $userId) {
                $q->where('sender_id', $currentUser->id)
                    ->where('receiver_id', $userId);
            })->orWhere(function ($q) use ($currentUser, $userId) {
                $q->where('sender_id', $userId)
                    ->where('receiver_id', $currentUser->id);
            });
        })
            ->with(['sender'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages);
    }

    public function store(Request $request, $userId)
    {
        $request->validate([
            'message' => 'required|string',
        ]);

        $currentUser = Auth::user();
        $receiver = User::findOrFail($userId);

        $message = DirectMessage::create([
            'sender_id' => $currentUser->id,
            'receiver_id' => $userId,
            'message' => $request->message,
        ]);

        $message->load('sender');

        broadcast(new NewMessage($message))->toOthers();

        return response()->json($message);
    }

    public function markAsRead($userId)
    {
        $currentUser = Auth::user();

        DirectMessage::where('sender_id', $userId)
            ->where('receiver_id', $currentUser->id)
            ->where('read', false)
            ->update(['read' => true]);

        return response()->json(['success' => true]);
    }
}
