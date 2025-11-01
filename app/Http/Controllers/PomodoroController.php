<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\PomodoroSetting;
use App\Models\PomodoroSession;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PomodoroController extends Controller
{
    /**
     * Constructor to apply auth middleware
     */
    public function __construct()
    {
        $this->middleware(['web', 'auth']);
    }

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
        Log::info('PomodoroController::updateSettings called', [
            'request_data' => $request->all(),
            'user_id' => Auth::id(),
            'is_api' => $request->is('api/*'),
            'route' => $request->route()->getName(),
            'path' => $request->path(),
            'method' => $request->method(),
            'auth_check' => Auth::check(),
            'accept_header' => $request->header('Accept'),
            'csrf_token' => $request->header('X-CSRF-TOKEN'),
            'session_id' => session()->getId()
        ]);

        try {
            $validated = $request->validate([
                'focus_minutes' => 'required|integer|min:1|max:120',
                'short_break_minutes' => 'required|integer|min:1|max:30',
                'long_break_minutes' => 'required|integer|min:1|max:60',
                'long_break_interval' => 'required|integer|min:1|max:10',
                'auto_start_breaks' => 'required|boolean',
                'auto_start_pomodoros' => 'required|boolean',
                'notifications_enabled' => 'required|boolean',
            ]);

            // Add is_deleted = false to ensure it's never deleted
            $validated['is_deleted'] = false;
            $validated['user_id'] = Auth::id();

            // Use transaction for database reliability
            DB::beginTransaction();
            try {
                // Try to find existing settings first
                $settings = PomodoroSetting::where('user_id', Auth::id())->first();

                if ($settings) {
                    // Update existing settings
                    $settings->fill($validated);
                    $saved = $settings->save();
                } else {
                    // Create new settings
                    $settings = new PomodoroSetting($validated);
                    $saved = $settings->save();
                }

                if (!$saved) {
                    throw new \Exception('Failed to save settings to database');
                }

                DB::commit();

                Log::info('Pomodoro settings saved', [
                    'settings_id' => $settings->id,
                    'user_id' => $settings->user_id,
                    'db_connection' => $settings->getConnectionName(),
                    'saved' => $saved
                ]);

                // Return appropriate response based on request type
                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'success' => true,
                        'message' => 'Settings saved successfully',
                        'settings' => $settings
                    ]);
                }

                return redirect()->route('pomodoro.index');
            } catch (\Exception $dbError) {
                DB::rollBack();
                throw $dbError;
            }
        } catch (\Exception $e) {
            Log::error('Error in PomodoroController::updateSettings', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to save settings: ' . $e->getMessage()
                ], 500);
            }

            return back()->withErrors(['error' => 'Failed to save settings: ' . $e->getMessage()]);
        }
    }

    /**
     * Record a completed pomodoro session
     */
    public function recordSession(Request $request)
    {
        Log::info('PomodoroController::recordSession called', [
            'request_data' => $request->all(),
            'user_id' => Auth::id(),
            'is_api' => $request->is('api/*'),
            'route' => $request->route()->getName(),
            'path' => $request->path(),
            'method' => $request->method(),
            'auth_check' => Auth::check(),
            'accept_header' => $request->header('Accept'),
            'csrf_token' => $request->header('X-CSRF-TOKEN'),
            'session_id' => session()->getId()
        ]);

        try {
            $validated = $request->validate([
                'type' => 'required|in:focus,short_break,long_break',
                'duration_minutes' => 'required|integer|min:1',
                'task_id' => 'nullable|exists:group_tasks,id',
            ]);

            // Manually create the model with connection handling
            $session = new PomodoroSession();
            $session->user_id = Auth::id();
            $session->started_at = now()->subMinutes($validated['duration_minutes']);
            $session->ended_at = now();
            $session->type = $validated['type'];
            $session->duration_minutes = $validated['duration_minutes'];
            $session->completed = true;
            $session->task_id = $validated['task_id'];
            $session->is_deleted = false;

            // Force save to the database with transaction handling
            DB::beginTransaction();
            try {
                $saved = $session->save();
                DB::commit();

                if (!$saved) {
                    throw new \Exception('Failed to save Pomodoro session to database');
                }

                Log::info('Pomodoro session created', [
                    'session_id' => $session->id,
                    'type' => $session->type,
                    'duration' => $session->duration_minutes,
                    'db_connection' => $session->getConnectionName(),
                    'saved' => $saved
                ]);

                return response()->json([
                    'success' => true,
                    'session' => $session
                ]);
            } catch (\Exception $dbError) {
                DB::rollBack();
                throw $dbError;
            }
        } catch (\Exception $e) {
            Log::error('Error in PomodoroController::recordSession', [
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
                'is_deleted' => false,
            ];
        }

        return response()->json([
            'success' => true,
            'settings' => $settings
        ]);
    }
}
