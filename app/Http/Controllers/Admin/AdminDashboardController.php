<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Group;
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

        return Inertia::render('admin/Dashboard', [
            'stats' => [
                'users' => [
                    'total' => $userCount,
                    'active' => $activeUsers,
                ],
                'groups' => [
                    'total' => $groupCount,
                    'active' => $activeGroups,
                ],
                'ai' => [
                    'total_prompts' => $totalAIPrompts,
                    'prompts_today' => $totalAIPromptsToday,
                ],
                'calendar' => [
                    'total_syncs' => $totalCalendarSyncs,
                    'active_syncs' => $activeCalendarSyncs,
                ],
            ],
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
     * Show the groups management page.
     */
    public function groups(): Response
    {
        $groups = Group::with(['owner', 'members'])
            ->withCount('members')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('admin/groups/Index', [
            'groups' => $groups
        ]);
    }

    /**
     * Generate PDF for groups.
     */
    public function groupsPdf()
    {
        $groups = Group::with(['owner', 'members'])
            ->withCount('members')
            ->orderBy('created_at', 'desc')
            ->get();

        $pdf = PDF::loadView('admin/groups/pdf', [
            'groups' => $groups
        ]);

        return $pdf->download('groups-report.pdf');
    }

    /**
     * Generate PDF for analytics.
     */
    public function analyticsPdf()
    {
        // Get basic stats
        $userCount = User::count();
        $groupCount = Group::count();
        $activeUsers = User::where('last_login_at', '>=', now()->subDays(7))->count();
        $activeGroups = Group::where('updated_at', '>=', now()->subDays(7))->count();

        $pdf = PDF::loadView('admin/analytics/pdf', [
            'stats' => [
                'users' => [
                    'total' => $userCount,
                    'active' => $activeUsers,
                ],
                'groups' => [
                    'total' => $groupCount,
                    'active' => $activeGroups,
                ],
            ]
        ]);

        return $pdf->download('analytics-report.pdf');
    }
}
