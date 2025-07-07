<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Analytics;
use App\Models\User;
use App\Models\Group;
use App\Models\AiPrompt;
use App\Models\CalendarSync;
use App\Models\MpesaTransaction;
use App\Models\WorkosAuth;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function index()
    {
        // Get calendar sync stats
        $calendarSyncs = CalendarSync::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as count')
        )
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($sync) {
                return [
                    'date' => $sync->date,
                    'count' => $sync->count
                ];
            });

        // Get WorkOS AuthKit stats
        $workosAuths = WorkosAuth::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as count')
        )
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($auth) {
                return [
                    'date' => $auth->date,
                    'count' => $auth->count
                ];
            });

        // Get Mpesa STK push stats
        $mpesaTransactions = MpesaTransaction::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as total_transactions'),
            DB::raw('SUM(CASE WHEN status = "success" THEN 1 ELSE 0 END) as successful_transactions')
        )
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($transaction) {
                return [
                    'date' => $transaction->date,
                    'total' => $transaction->total_transactions,
                    'successful' => $transaction->successful_transactions
                ];
            });

        // Get AI service details
        $aiPrompts = AiPrompt::with(['user:id,name'])
            ->select('id', 'user_id', 'prompt', 'response', 'created_at')
            ->where('created_at', '>=', now()->subDays(7))
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($prompt) {
                return [
                    'id' => $prompt->id,
                    'user' => $prompt->user->name,
                    'prompt' => $prompt->prompt,
                    'response' => $prompt->response,
                    'created_at' => $prompt->created_at->diffForHumans()
                ];
            });

        // Get summary statistics
        $stats = [
            'calendar' => [
                'total_syncs' => CalendarSync::count(),
                'active_syncs' => CalendarSync::where('last_sync_at', '>=', now()->subHours(24))->count(),
                'failed_syncs' => CalendarSync::where('status', 'failed')->count()
            ],
            'workos' => [
                'total_auths' => WorkosAuth::count(),
                'successful_auths' => WorkosAuth::where('status', 'success')->count(),
                'failed_auths' => WorkosAuth::where('status', 'failed')->count()
            ],
            'mpesa' => [
                'total_pushes' => MpesaTransaction::count(),
                'successful_pushes' => MpesaTransaction::where('status', 'success')->count(),
                'total_amount' => MpesaTransaction::where('status', 'success')->sum('amount')
            ],
            'ai' => [
                'total_prompts' => AiPrompt::count(),
                'prompts_today' => AiPrompt::whereDate('created_at', Carbon::today())->count(),
                'unique_users' => AiPrompt::distinct('user_id')->count('user_id')
            ]
        ];

        return Inertia::render('admin/analytics/Index', [
            'stats' => $stats,
            'graphs' => [
                'calendar_syncs' => $calendarSyncs,
                'workos_auths' => $workosAuths,
                'mpesa_transactions' => $mpesaTransactions
            ],
            'ai_prompts' => $aiPrompts
        ]);
    }

    public function downloadPdf()
    {
        // Replace with your actual analytics data retrieval
        $analyticsData = []; // Placeholder
        $pdf = Pdf::loadView('admin.analytics.pdf', ['analytics' => $analyticsData]);
        return $pdf->download('analytics.pdf');
    }
}
