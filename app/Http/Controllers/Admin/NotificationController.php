<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification; // Assuming a Notification model exists
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index()
    {
        // Replace with your actual notification data retrieval
        $notifications = []; // Placeholder
        return Inertia::render('admin/notifications/Index', ['notifications' => $notifications]);
    }

    public function downloadPdf()
    {
        // Replace with your actual notification data retrieval
        $notifications = []; // Placeholder
        $pdf = Pdf::loadView('admin.notifications.pdf', ['notifications' => $notifications]);
        return $pdf->download('notifications.pdf');
    }
}
