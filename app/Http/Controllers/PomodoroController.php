<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\PomodoroSetting;
use App\Models\PomodoroSession;
use Illuminate\Support\Facades\Auth;

class PomodoroController extends Controller
{
    /**
     * Display the pomodoro timer page.
     */
    public function index(Request $request)
    {
        // Get user's pomodoro settings or use defaults
        $settings = PomodoroSetting::where('user_id', Auth::id())->first();

        if (!$settings) {
            $settings = [
                'focus_minutes' => 25,
                'short_break_minutes' => 5,
                'long_break_minutes' => 15,
                'long_break_interval' => 4,
                'auto_start_breaks' => true,
                'auto_start_pomodoros' => false,
                'notifications_enabled' => true,
            ];
        }

        // Get recent pomodoro sessions
        $sessions = PomodoroSession::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get();

        // Count completed focus sessions
        $completedCount = PomodoroSession::where('user_id', Auth::id())
            ->where('type', 'focus')
            ->where('completed', true)
            ->count();

        return Inertia::render('Pomodoro/Index', [
            'userId' => Auth::id(),
            'settings' => $settings,
            'sessions' => $sessions,
            'completedCount' => $completedCount
        ]);
    }

    /**
     * Update pomodoro settings
     */
    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'focus_minutes' => 'required|integer|min:1|max:120',
            'short_break_minutes' => 'required|integer|min:1|max:30',
            'long_break_minutes' => 'required|integer|min:1|max:60',
            'long_break_interval' => 'required|integer|min:1|max:10',
            'auto_start_breaks' => 'required|boolean',
            'auto_start_pomodoros' => 'required|boolean',
            'notifications_enabled' => 'required|boolean',
        ]);

        PomodoroSetting::updateOrCreate(
            ['user_id' => Auth::id()],
            $validated
        );

        return redirect()->route('pomodoro.index');
    }

    /**
     * Record a completed pomodoro session
     */
    public function recordSession(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('PomodoroController::recordSession called', [
            'request_data' => $request->all(),
            'user_id' => Auth::id()
        ]);

        try {
            $validated = $request->validate([
                'type' => 'required|in:focus,short_break,long_break',
                'duration_minutes' => 'required|integer|min:1',
                'task_id' => 'nullable|exists:group_tasks,id',
            ]);

            $session = PomodoroSession::create([
                'user_id' => Auth::id(),
                'started_at' => now()->subMinutes($validated['duration_minutes']),
                'ended_at' => now(),
                'type' => $validated['type'],
                'duration_minutes' => $validated['duration_minutes'],
                'completed' => true,
                'task_id' => $validated['task_id'],
            ]);

            \Illuminate\Support\Facades\Log::info('Pomodoro session created', [
                'session_id' => $session->id,
                'type' => $session->type,
                'duration' => $session->duration_minutes
            ]);

            return response()->json([
                'success' => true,
                'session' => $session
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error in PomodoroController::recordSession', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to record pomodoro session: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user's pomodoro statistics
     */
    public function getStats()
    {
        // Count sessions by type
        $focusSessions = PomodoroSession::where('user_id', Auth::id())
            ->where('type', 'focus')
            ->where('completed', true)
            ->count();

        $shortBreaks = PomodoroSession::where('user_id', Auth::id())
            ->where('type', 'short_break')
            ->where('completed', true)
            ->count();

        $longBreaks = PomodoroSession::where('user_id', Auth::id())
            ->where('type', 'long_break')
            ->where('completed', true)
            ->count();

        // Calculate total focus time in minutes
        $totalFocusTime = PomodoroSession::where('user_id', Auth::id())
            ->where('type', 'focus')
            ->where('completed', true)
            ->sum('duration_minutes');

        // Get focus sessions for last 7 days
        $lastWeekSessions = PomodoroSession::where('user_id', Auth::id())
            ->where('type', 'focus')
            ->where('completed', true)
            ->where('created_at', '>=', now()->subDays(7))
            ->selectRaw('DATE(created_at) as date, SUM(duration_minutes) as minutes')
            ->groupBy('date')
            ->get();

        return response()->json([
            'focusSessions' => $focusSessions,
            'shortBreaks' => $shortBreaks,
            'longBreaks' => $longBreaks,
            'totalFocusTime' => $totalFocusTime,
            'lastWeekSessions' => $lastWeekSessions
        ]);
    }

    /**
     * Get user's pomodoro settings
     */
    public function getUserSettings($userId = null)
    {
        // If no specific user ID provided, use authenticated user
        $userId = $userId ?? Auth::id();

        // Check if user has permission to access this
        if (Auth::id() != $userId) {
            abort(403, 'You can only access your own settings');
        }

        $settings = PomodoroSetting::where('user_id', $userId)->first();

        if (!$settings) {
            $settings = [
                'focus_minutes' => 25,
                'short_break_minutes' => 5,
                'long_break_minutes' => 15,
                'long_break_interval' => 4,
                'auto_start_breaks' => true,
                'auto_start_pomodoros' => false,
                'notifications_enabled' => true,
            ];
        }

        return response()->json([
            'success' => true,
            'settings' => $settings
        ]);
    }
}
