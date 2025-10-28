<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\PromptService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AIUsageMiddleware
{
    /**
     * The prompt service instance.
     *
     * @var \App\Services\PromptService
     */
    protected $promptService;

    /**
     * Create a new middleware instance.
     *
     * @param  \App\Services\PromptService  $promptService
     * @return void
     */
    public function __construct(PromptService $promptService)
    {
        $this->promptService = $promptService;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        if (!$this->promptService->hasPromptsRemaining($user)) {
            Log::info('User has no prompts remaining, redirecting to pricing page', [
                'user_id' => $user->id
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'error' => 'No AI prompts remaining',
                    'redirect' => route('pricing.index')
                ], 403);
            }

            return redirect()->route('pricing.index')
                ->with('error', 'You have no AI prompts remaining. Please purchase more to continue using AI services.');
        }

        return $next($request);
    }
}
