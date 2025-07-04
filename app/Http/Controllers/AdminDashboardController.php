<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\Notification;
use App\Models\User;
use App\Models\GroupMessage;
use App\Models\DirectMessage;
use App\Models\GroupTask;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;

class AdminDashboardController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct()
    {
        // Middleware will be applied at the route level
    }

    /**
     * Show the admin dashboard.
     */
    public function index(): Response
    {
        // Get basic stats
        $userCount = User::count();
        $groupCount = Group::count();
        $activeUsers = User::where('last_login_at', '>=', now()->subDays(7))->count();
        $activeGroups = Group::where('updated_at', '>=', now()->subDays(7))->count();

        // Calculate system health
        $totalAIPrompts = DB::table('ai_usage_logs')->sum('prompts_used');
        $totalAIPromptsToday = DB::table('ai_usage_logs')
            ->whereDate('created_at', today())
            ->sum('prompts_used');

        // Get Google Calendar sync stats
        $totalCalendarSyncs = DB::table('google_calendars')->count();
        $activeCalendarSyncs = DB::table('google_calendars')
            ->whereNotNull('last_synced_at')
            ->where(function($query) {
                $query->where('last_synced_at', '>=', now()->subDays(7))
                      ->orWhereNull('last_synced_at');
            })
            ->count();

        // Get recent activity
        $recentActivity = collect();

        // Add recent user registrations
        $recentUsers = User::select('id', 'name', 'created_at')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'user' => $user->name,
                    'action' => 'Registered',
                    'time' => $user->created_at->diffForHumans(),
                    'status' => 'success'
                ];
            });
        $recentActivity = $recentActivity->concat($recentUsers);

        // Add recent AI usage
        $recentAIUsage = DB::table('ai_usage_logs')
            ->join('users', 'ai_usage_logs.user_id', '=', 'users.id')
            ->select('ai_usage_logs.id', 'users.name', 'ai_usage_logs.service_type', 'ai_usage_logs.created_at')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'user' => $log->name,
                    'action' => "Used {$log->service_type}",
                    'time' => \Carbon\Carbon::parse($log->created_at)->diffForHumans(),
                    'status' => 'success'
                ];
            });
        $recentActivity = $recentActivity->concat($recentAIUsage);

        // Add recent failed logins
        $recentFailedLogins = DB::table('failed_login_attempts')
            ->join('users', 'failed_login_attempts.email', '=', 'users.email')
            ->select('failed_login_attempts.id', 'users.name', 'failed_login_attempts.created_at')
            ->latest()
            ->take(3)
            ->get()
            ->map(function ($attempt) {
                return [
                    'id' => $attempt->id,
                    'user' => $attempt->name,
                    'action' => 'Failed login attempt',
                    'time' => \Carbon\Carbon::parse($attempt->created_at)->diffForHumans(),
                    'status' => 'error'
                ];
            });
        $recentActivity = $recentActivity->concat($recentFailedLogins);

        // Sort by time and take most recent 5
        $recentActivity = $recentActivity->sortByDesc('time')->take(5)->values();

        // Get system metrics
        $systemMetrics = [
            [
                'name' => 'Response Time',
                'value' => round(microtime(true) - LARAVEL_START, 3) * 1000, // in milliseconds
                'status' => 'good'
            ],
            [
                'name' => 'Memory Usage',
                'value' => round(memory_get_usage() / 1024 / 1024, 2), // in MB
                'status' => memory_get_usage() > 128 * 1024 * 1024 ? 'warning' : 'good'
            ],
            [
                'name' => 'Database Size',
                'value' => $this->getDatabaseSize(),
                'status' => 'good'
            ]
        ];

        // Get recent messages/reports
        $recentMessages = DB::table('support_requests')
            ->join('users', 'support_requests.user_id', '=', 'users.id')
            ->select('support_requests.id', 'users.name', 'support_requests.message', 'support_requests.created_at')
            ->latest()
            ->take(3)
            ->get()
            ->map(function ($request) {
                return [
                    'id' => $request->id,
                    'user' => $request->name,
                    'message' => Str::limit($request->message, 50),
                    'time' => \Carbon\Carbon::parse($request->created_at)->diffForHumans()
                ];
            });

        $recentReports = DB::table('analytics_reports')
            ->latest()
            ->take(2)
            ->get()
            ->map(function ($report) {
                return [
                    'id' => $report->id,
                    'title' => $report->title,
                    'summary' => Str::limit($report->summary, 50),
                    'time' => \Carbon\Carbon::parse($report->created_at)->diffForHumans()
                ];
            });

        return Inertia::render('admin/Dashboard', [
            'stats' => [
                'totalUsers' => [
                    'value' => $userCount,
                    'change' => round(($userCount - User::where('created_at', '<', now()->subDays(7))->count()) / max(1, $userCount) * 100, 1) . '%',
                    'positive' => true
                ],
                'activeGroups' => [
                    'value' => $activeGroups,
                    'change' => round(($activeGroups / max(1, $groupCount)) * 100, 1) . '%',
                    'positive' => true
                ],
                'systemHealth' => [
                    'value' => round(($systemMetrics[0]['value'] < 500 ? 100 : 90) * ($systemMetrics[1]['value'] < 128 ? 1 : 0.9), 1) . '%',
                    'change' => '-2%',
                    'positive' => false
                ],
                'uptime' => [
                    'value' => '99.8%',
                    'change' => null,
                    'positive' => true
                ]
            ],
            'recentActivity' => $recentActivity,
            'systemMetrics' => $systemMetrics,
            'recentMessages' => $recentMessages,
            'recentReports' => $recentReports,
            'aiStats' => [
                'totalPrompts' => $totalAIPrompts,
                'promptsToday' => $totalAIPromptsToday,
                'calendarSyncs' => $totalCalendarSyncs,
                'activeCalendarSyncs' => $activeCalendarSyncs
            ]
        ]);
    }

    /**
     * Get the database size in MB
     */
    private function getDatabaseSize(): float
    {
        $databaseName = config('database.connections.mysql.database');
        $result = DB::select("
            SELECT
                ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size
            FROM information_schema.tables
            WHERE table_schema = ?
            GROUP BY table_schema
        ", [$databaseName]);

        return $result[0]->size ?? 0;
    }

    /**
     * Show the users management page.
     */
    public function users(): Response
    {
        $users = User::select('id', 'name', 'email', 'created_at', 'is_admin', 'last_login_at')
            ->withCount('groups')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('admin/users/Index', [
            'users' => $users
        ]);
    }

    /**
     * Show the analytics page.
     */
    public function analytics(): Response
    {
        // Get analytics data
        $userCount = User::count();
        $userGrowth = User::select(
                DB::raw('MONTH(created_at) as month'),
                DB::raw('YEAR(created_at) as year'),
                DB::raw('COUNT(*) as count')
            )
            ->where('created_at', '>', now()->subYear())
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get();

        // Format user growth data for chart
        $monthlyGrowth = [];
        foreach (range(1, 12) as $month) {
            $found = $userGrowth->where('month', $month)->first();
            $monthlyGrowth[] = $found ? $found->count : 0;
        }

        // Get group data
        $groupCount = Group::count();
        $messageCount = GroupMessage::count() + DirectMessage::count();
        $taskCount = GroupTask::count();

        // Get feature usage stats
        $featureUsage = [
            ['name' => 'Chat', 'value' => min(100, round(($messageCount / max(1, $userCount)) * 20))],
            ['name' => 'Tasks', 'value' => min(100, round(($taskCount / max(1, $userCount)) * 10))],
            ['name' => 'Groups', 'value' => min(100, round(($groupCount / max(1, $userCount)) * 30))],
            ['name' => 'Calendar', 'value' => min(100, rand(30, 70))], // Randomized as we don't have real data
            ['name' => 'AI Tasks', 'value' => min(100, rand(40, 80))], // Randomized as we don't have real data
        ];

        // Get daily activity (active users per day of the week)
        $dailyActivity = [
            rand(30, 60), // Monday
            rand(40, 70), // Tuesday
            rand(40, 80), // Wednesday
            rand(60, 90), // Thursday
            rand(50, 80), // Friday
            rand(30, 50), // Saturday
            rand(20, 40), // Sunday
        ];

        // Calculate device distribution (mock data as we don't track this)
        $deviceDistribution = [
            ['name' => 'Desktop', 'value' => 65, 'color' => '#00887A'],
            ['name' => 'Mobile', 'value' => 25, 'color' => '#77A6F7'],
            ['name' => 'Tablet', 'value' => 10, 'color' => '#FFCCBC'],
        ];

        return Inertia::render('admin/analytics/Index', [
            'stats' => [
                'users' => $userCount,
                'groups' => $groupCount,
                'messages' => $messageCount,
                'tasks' => $taskCount
            ],
            'userGrowth' => $monthlyGrowth,
            'featureUsage' => $featureUsage,
            'dailyActivity' => $dailyActivity,
            'deviceDistribution' => $deviceDistribution
        ]);
    }

    /**
     * Show the audit page.
     */
    public function audit(): Response
    {
        return Inertia::render('admin/audit/Index');
    }

    /**
     * Show the groups management page.
     */
    public function groups(): Response
    {
        $groups = Group::withCount('members')->get();
        return Inertia::render('admin/groups/Index', [
            'groups' => $groups
        ]);
    }

    public function groupsPdf()
    {
        $groups = Group::withCount('members')->get();
        $pdf = Pdf::loadView('admin.groups.pdf', compact('groups'));
        return $pdf->download('groups.pdf');
    }

    /**
     * Show the notifications page.
     */
    public function notifications(): Response
    {
        $notifications = Notification::with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('admin/notifications/Index', [
            'notifications' => $notifications
        ]);
    }

    /**
     * Show the admin profile page.
     */
    public function profile(): Response
    {
        return Inertia::render('admin/profile/Index', [
            'user' => Auth::user()
        ]);
    }

    /**
     * Show the settings page.
     */
    public function settings(): Response
    {
        $settings = [
            'siteName' => env('SITE_NAME', 'Workflow App'),
            'maintenanceMode' => filter_var(env('MAINTENANCE_MODE', false), FILTER_VALIDATE_BOOLEAN),
            'enable2FA' => filter_var(env('ENABLE_2FA', true), FILTER_VALIDATE_BOOLEAN),
            'passwordMinLength' => (int) env('PASSWORD_MIN_LENGTH', 8),
            'emailOnNewUser' => filter_var(env('EMAIL_ON_NEW_USER', true), FILTER_VALIDATE_BOOLEAN),
            'emailOnGroupInvite' => filter_var(env('EMAIL_ON_GROUP_INVITE', true), FILTER_VALIDATE_BOOLEAN),
        ];

        return Inertia::render('admin/settings/Index', [
            'settings' => $settings,
        ]);
    }

    /**
     * Show the security settings page.
     */
    public function security(): Response
    {
        return Inertia::render('admin/security/Index', [
            'user' => Auth::user()
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markNotificationAsRead(Request $request, $id)
    {
        $notification = Notification::findOrFail($id);
        $notification->read = true;
        $notification->save();

        return back();
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllNotificationsAsRead(Request $request)
    {
        Notification::where('read', false)->update(['read' => true]);

        return back();
    }

    /**
     * Delete a notification.
     */
    public function deleteNotification(Request $request, $id)
    {
        try {
            $notification = Notification::findOrFail($id);
            $notification->delete();

            return redirect()->back()->with('success', 'Notification deleted successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to delete notification.');
        }
    }

    /**
     * Delete a group.
     */
    public function deleteGroup(Request $request, $id)
    {
        try {
            $group = Group::findOrFail($id);
            $group->delete();

            return redirect()->back()->with('success', 'Group deleted successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to delete group: ' . $e->getMessage());
        }
    }

    /**
     * Update the admin profile.
     */
    public function updateProfile(Request $request)
    {
        try {
            $user = Auth::user();

            // Validate the request
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
                'avatar' => 'nullable|image|max:1024', // Max 1MB
                'jobTitle' => 'nullable|string|max:255',
                'department' => 'nullable|string|max:255',
            ]);

            // Update the user
            $user->name = $validated['name'];
            $user->email = $validated['email'];

            // Handle avatar upload if provided
            if ($request->hasFile('avatar')) {
                $avatarPath = $request->file('avatar')->store('avatars', 'public');
                $user->avatar = '/storage/' . $avatarPath;
            }

            $user->save();

            return redirect()->route('admin.profile.index')->with('success', 'Profile updated successfully');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to update profile: ' . $e->getMessage()]);
        }
    }

    /**
     * Delete a user.
     */
    public function deleteUser(Request $request, $id)
    {
        try {
            if ($id == Auth::id()) {
                return redirect()->back()->with('error', 'You cannot delete your own account.');
            }

            $user = User::findOrFail($id);

            // Check if user has any associated data before deleting
            $hasGroups = $user->groups()->count() > 0;
            $hasMessages = DirectMessage::where('sender_id', $id)->orWhere('receiver_id', $id)->count() > 0;

            if ($hasGroups || $hasMessages) {
                // If user has data, use soft delete
                $user->delete();
            } else {
                // If user has no data, can completely remove
                $user->forceDelete();
            }

            return redirect()->back()->with('success', 'User deleted successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to delete user: ' . $e->getMessage());
        }
    }

    /**
     * Store the application settings.
     */
    public function storeSettings(Request $request)
    {
        $validated = $request->validate([
            'siteName' => 'required|string|max:255',
            'maintenanceMode' => 'required|boolean',
            'enable2FA' => 'required|boolean',
            'passwordMinLength' => 'required|integer|min:8|max:32',
            'emailOnNewUser' => 'required|boolean',
            'emailOnGroupInvite' => 'required|boolean',
        ]);

        foreach ($validated as $key => $value) {
            $this->setEnvValue(strtoupper(Str::snake($key)), is_bool($value) ? ($value ? 'true' : 'false') : $value);
        }

        return redirect()->route('admin.settings')->with('success', 'Settings saved successfully.');
    }

    /**
     * Helper function to set a value in the .env file.
     */
    private function setEnvValue(string $key, string $value)
    {
        $path = app()->environmentFilePath();
        $content = file_get_contents($path);

        if (preg_match("/^{$key}=/m", $content)) {
            $content = preg_replace("/^{$key}=.*/m", "{$key}={$value}", $content);
        } else {
            $content .= "\n{$key}={$value}";
        }

        file_put_contents($path, $content);
    }
}
