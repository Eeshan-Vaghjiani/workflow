<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\PromptService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PromptController extends Controller
{
    /**
     * The prompt service instance.
     *
     * @var \App\Services\PromptService
     */
    protected $promptService;

    /**
     * Create a new controller instance.
     *
     * @param  \App\Services\PromptService  $promptService
     * @return void
     */
    public function __construct(PromptService $promptService)
    {
        $this->promptService = $promptService;
        $this->middleware('auth');
    }

    /**
     * Get the current user's prompt balance.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getBalance()
    {
        $user = Auth::user();

        return response()->json([
            'ai_prompts_remaining' => $user->ai_prompts_remaining,
            'is_paid_user' => $user->is_paid_user,
            'last_payment_date' => $user->last_payment_date,
            'total_prompts_purchased' => $user->total_prompts_purchased,
        ]);
    }

    /**
     * Use a prompt for AI service.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function usePrompt(Request $request)
    {
        $validated = $request->validate([
            'service_type' => 'required|string',
            'count' => 'sometimes|integer|min:1|max:10',
        ]);

        $user = Auth::user();
        $count = $validated['count'] ?? 1;

        $result = $this->promptService->usePrompt(
            $user,
            $validated['service_type'],
            $count
        );

        if (!$result) {
            return response()->json([
                'error' => 'Insufficient prompts',
                'ai_prompts_remaining' => $user->ai_prompts_remaining,
                'redirect' => route('pricing.index')
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Prompt used successfully',
            'ai_prompts_remaining' => $user->ai_prompts_remaining
        ]);
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
