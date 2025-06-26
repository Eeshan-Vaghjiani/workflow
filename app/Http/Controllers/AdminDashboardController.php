<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

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
        return Inertia::render('admin/Dashboard');
    }

    /**
     * Show the users management page.
     */
    public function users(): Response
    {
        return Inertia::render('admin/users/Index');
    }

    /**
     * Show the analytics page.
     */
    public function analytics(): Response
    {
        return Inertia::render('admin/analytics/Index');
    }

    /**
     * Show the audit page.
     */
    public function audit(): Response
    {
        return Inertia::render('admin/audit/Index');
    }
}
