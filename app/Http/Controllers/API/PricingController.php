<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\PricingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

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
     * Display a listing of the pricing packages.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $packages = $this->pricingService->getPackages();
        $user = Auth::user();

        return response()->json([
            'packages' => $packages,
            'user' => [
                'ai_prompts_remaining' => $user->ai_prompts_remaining,
                'is_paid_user' => $user->is_paid_user,
                'last_payment_date' => $user->last_payment_date,
                'total_prompts_purchased' => $user->total_prompts_purchased,
            ]
        ]);
    }

    /**
     * Process a package purchase.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function purchase(Request $request)
    {
        $validated = $request->validate([
            'package_id' => 'required|integer|exists:pricing_packages,id',
            'phone_number' => 'required|string|min:10|max:15',
        ]);

        $user = Auth::user();

        // Here you would integrate with your existing M-Pesa payment flow
        // For now, we'll just process the purchase directly

        $result = $this->pricingService->processPurchase($user, $validated['package_id']);

        if (!$result['success']) {
            return response()->json([
                'error' => $result['message']
            ], 400);
        }

        return response()->json($result);
    }

    /**
     * Display the specified pricing package.
     *
     * @param  string  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(string $id)
    {
        $package = $this->pricingService->getPackage((int) $id);

        if (!$package) {
            return response()->json(['error' => 'Package not found'], 404);
        }

        return response()->json(['package' => $package]);
    }
}
