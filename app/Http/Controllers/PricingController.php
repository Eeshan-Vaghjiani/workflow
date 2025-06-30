<?php

namespace App\Http\Controllers;

use App\Services\PricingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PricingController extends Controller
{
    /**
     * The pricing service instance.
     *
     * @var \App\Services\PricingService
     */
    protected $pricingService;

    /**
     * Create a new controller instance.
     *
     * @param  \App\Services\PricingService  $pricingService
     * @return void
     */
    public function __construct(PricingService $pricingService)
    {
        $this->pricingService = $pricingService;
        $this->middleware('auth');
    }

    /**
     * Display the pricing page.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $packages = $this->pricingService->getPackages();
        $user = Auth::user();

        return Inertia::render('Pricing/Index', [
            'packages' => $packages,
            'user' => [
                'ai_prompts_remaining' => $user->ai_prompts_remaining,
                'is_paid_user' => $user->is_paid_user,
                'last_payment_date' => $user->last_payment_date,
                'total_prompts_purchased' => $user->total_prompts_purchased,
            ],
        ]);
    }

    /**
     * Show the purchase confirmation page.
     *
     * @param  int  $id
     * @return \Inertia\Response
     */
    public function confirmPurchase($id)
    {
        $package = $this->pricingService->getPackage((int) $id);

        if (!$package) {
            return redirect()->route('pricing.index')
                ->with('error', 'Package not found');
        }

        return Inertia::render('Pricing/Confirm', [
            'package' => $package,
        ]);
    }
}
