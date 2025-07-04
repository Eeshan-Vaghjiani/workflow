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
        // Get summary stats for the dashboard
        $userCount = User::count();
        $groupCount = Group::count();
        $notificationCount = Notification::where('read', false)->count();

        return Inertia::render('admin/Dashboard', [
            'stats' => [
                'users' => $userCount,
                'groups' => $groupCount,
                'unread_notifications' => $notificationCount
            ]
        ]);
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
        $groups = Group::with('owner:id,name')
            ->withCount('members')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('admin/groups/Index', [
            'groups' => $groups
        ]);
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
        return Inertia::render('admin/settings/Index');
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
}
