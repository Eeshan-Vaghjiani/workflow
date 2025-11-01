<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\User;
use App\Models\GroupMessage;
use App\Models\DirectMessage;
use App\Models\GroupTask;
use App\Models\MpesaTransaction;
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

        // Get assignment stats
        $assignmentCount = DB::table('group_assignments')->count();

        // M-Pesa Analytics
        $totalProRevenue = MpesaTransaction::where('status', 'completed')->sum('amount');
        $mpesaPromptsCompleted = MpesaTransaction::where('status', 'completed')->count();
        $mpesaPromptsFailed = MpesaTransaction::where('status', '!=', 'completed')->count();

        // AI & Integration Stats from api_logs
        $totalAIPrompts = DB::table('api_logs')->count();
        $promptsToday = DB::table('api_logs')->whereDate('created_at', today())->count();

        // Get Google Calendar sync stats
        $totalCalendarSyncs = DB::table('google_calendars')->count();
        $activeCalendarSyncs = DB::table('google_calendars')
            ->where('updated_at', '>=', now()->subDays(7))
            ->count();

        // API Usage Chart data
        $apiUsageLast7Days = DB::table('api_logs')
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get()
            ->map(function ($item) {
                return ['date' => $item->date, 'count' => $item->count];
            });

        // Get system health metrics
        return Inertia::render('admin/Dashboard', [
            'stats' => [
                'users' => ['total' => $userCount],
                'groups' => ['total' => $groupCount],
                'mpesa' => ['total_revenue' => number_format($totalProRevenue, 2)],
                'assignments' => ['total' => $assignmentCount],
            ],
            'charts' => [
                'api_usage_last_7_days' => $apiUsageLast7Days,
                'mpesa_prompts_status' => [
                    'completed' => $mpesaPromptsCompleted,
                    'failed' => $mpesaPromptsFailed,
                ],
            ],
            'aiStats' => [
                'totalPrompts' => $totalAIPrompts,
                'promptsToday' => $promptsToday,
                'calendarSyncs' => $totalCalendarSyncs,
                'activeCalendarSyncs' => $activeCalendarSyncs,
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
            'date' => now()->format('F j, Y'),
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
