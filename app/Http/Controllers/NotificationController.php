<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    /**
     * Display a listing of the user's notifications.
     */
    public function index()
    {
        $notifications = auth()->user()->notifications()
            ->latest()
            ->get();

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(Notification $notification)
    {
        if ($notification->user_id !== auth()->id()) {
            abort(403, 'You are not authorized to access this notification');
        }

        $notification->update(['read' => true]);

        return back();
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead()
    {
        auth()->user()->notifications()
            ->where('read', false)
            ->update(['read' => true]);

        return back();
    }

    /**
     * Get unread notifications count.
     */
    public function getUnreadCount()
    {
        $count = auth()->user()->notifications()
            ->where('read', false)
            ->count();

        return response()->json(['count' => $count]);
    }
}
