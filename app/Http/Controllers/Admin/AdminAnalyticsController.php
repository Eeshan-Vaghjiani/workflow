<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Group;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class AdminAnalyticsController extends Controller
{
    public function index()
    {
        // Get the last 30 days of data
        $startDate = Carbon::now()->subDays(30)->startOfDay();

        // Fill in missing dates with zero counts
        $dates = collect();
        for ($date = clone $startDate; $date <= Carbon::now(); $date->addDay()) {
            $dates->push($date->format('Y-m-d'));
        }

        // Get user registrations per day
        $userRegistrations = User::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as count')
        )
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'count' => (int) $item->count
                ];
            });

        // Get group creations per day
        $groupCreations = Group::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as count')
        )
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'count' => (int) $item->count
                ];
            });

        // Get total counts
        $totalUsers = User::count();
        $totalGroups = Group::count();

        // Safely check if calendar_syncs table exists
        $totalSyncs = 0;
        if (Schema::hasTable('calendar_syncs')) {
            $totalSyncs = DB::table('calendar_syncs')->count();
        }

        // Get Mpesa transaction stats
        $mpesaStats = [
            'total_transactions' => 0,
            'total_amount' => 0,
            'completed_transactions' => 0,
            'completed_amount' => 0
        ];

        $mpesaTransactions = collect();

        if (Schema::hasTable('mpesa_transactions')) {
            $mpesaStats['total_transactions'] = DB::table('mpesa_transactions')->count() ?? 0;
            $mpesaStats['total_amount'] = DB::table('mpesa_transactions')->sum('amount') ?? 0;

            $mpesaStats['completed_transactions'] = DB::table('mpesa_transactions')
                ->where('status', 'completed')
                ->count() ?? 0;

            $mpesaStats['completed_amount'] = DB::table('mpesa_transactions')
                ->where('status', 'completed')
                ->sum('amount') ?? 0;

            // Get Mpesa transactions by day
            $mpesaTransactions = DB::table('mpesa_transactions')
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(amount) as amount')
                )
                ->where('created_at', '>=', $startDate)
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->map(function ($item) {
                    return [
                        'date' => $item->date,
                        'count' => (int) $item->count,
                        'amount' => (float) $item->amount
                    ];
                });

            $mpesaTransactions = $this->fillMissingDates($dates, $mpesaTransactions, true);
        }

        $userRegistrations = $this->fillMissingDates($dates, $userRegistrations);
        $groupCreations = $this->fillMissingDates($dates, $groupCreations);

        // Get API usage data if available
        $apiUsage = [];
        if (Schema::hasTable('api_requests')) {
            $apiUsage = DB::table('api_requests')
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('COUNT(*) as count')
                )
                ->where('created_at', '>=', $startDate)
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->map(function ($item) {
                    return [
                        'date' => $item->date,
                        'count' => (int) $item->count
                    ];
                });

            $apiUsage = $this->fillMissingDates($dates, $apiUsage);
        }

        return Inertia::render('admin/analytics/Index', [
            'analytics_data' => [
                'total_users' => $totalUsers,
                'total_groups' => $totalGroups,
                'total_syncs' => $totalSyncs,
                'user_registrations' => $userRegistrations,
                'group_creations' => $groupCreations,
                'mpesa_stats' => $mpesaStats,
                'mpesa_transactions' => $mpesaTransactions ?? [],
                'api_usage' => $apiUsage
            ]
        ]);
    }

    /**
     * Generate PDF report for analytics
     */
    public function analyticsPdf()
    {
        // Get the last 30 days of data
        $startDate = Carbon::now()->subDays(30)->startOfDay();

        // Get user registrations per day
        $userRegistrations = User::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as count')
        )
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Get group creations per day
        $groupCreations = Group::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as count')
        )
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Get total counts
        $totalUsers = User::count();
        $totalGroups = Group::count();

        // Get Mpesa transaction stats
        $mpesaStats = [
            'total_transactions' => 0,
            'total_amount' => 0,
            'completed_transactions' => 0,
            'completed_amount' => 0
        ];

        if (Schema::hasTable('mpesa_transactions')) {
            $mpesaStats['total_transactions'] = DB::table('mpesa_transactions')->count() ?? 0;
            $mpesaStats['total_amount'] = DB::table('mpesa_transactions')->sum('amount') ?? 0;

            $mpesaStats['completed_transactions'] = DB::table('mpesa_transactions')
                ->where('status', 'completed')
                ->count() ?? 0;

            $mpesaStats['completed_amount'] = DB::table('mpesa_transactions')
                ->where('status', 'completed')
                ->sum('amount') ?? 0;
        }

        $pdf = PDF::loadView('admin/analytics/pdf', [
            'userRegistrations' => $userRegistrations,
            'groupCreations' => $groupCreations,
            'totalUsers' => $totalUsers,
            'totalGroups' => $totalGroups,
            'mpesaStats' => $mpesaStats,
            'date' => now()->format('Y-m-d H:i:s')
        ]);

        return $pdf->download('analytics-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Fill in missing dates with zero counts
     */
    private function fillMissingDates($dates, $data, $includeAmount = false)
    {
        $dataByDate = $data->keyBy('date');

        return $dates->map(function ($date) use ($dataByDate, $includeAmount) {
            $result = [
                'date' => $date,
                'count' => $dataByDate->get($date, ['count' => 0])['count']
            ];

            if ($includeAmount) {
                $result['amount'] = $dataByDate->get($date, ['amount' => 0])['amount'];
            }

            return $result;
        })->values();
    }
}
