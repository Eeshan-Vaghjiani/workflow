<?php

namespace App\Services;

use App\Models\User;
use App\Models\AIUsageLog;
use Illuminate\Support\Facades\Log;

class PromptService
{
    /**
     * Check if a user has prompts remaining
     *
     * @param User $user
     * @return bool
     */
    public function hasPromptsRemaining(User $user): bool
    {
        return $user->ai_prompts_remaining > 0;
    }

    /**
     * Use a prompt and log the usage
     *
     * @param User $user
     * @param string $serviceType
     * @param int $count
     * @return bool
     */
    public function usePrompt(User $user, string $serviceType, int $count = 1): bool
    {
        if ($user->ai_prompts_remaining < $count) {
            Log::info('User has insufficient prompts', [
                'user_id' => $user->id,
                'prompts_remaining' => $user->ai_prompts_remaining,
                'prompts_requested' => $count
            ]);
            return false;
        }

        // Decrement prompt count
        $user->decrement('ai_prompts_remaining', $count);
        $user->refresh();

        // Log usage
        AIUsageLog::create([
            'user_id' => $user->id,
            'service_type' => $serviceType,
            'prompts_used' => $count,
            'remaining_prompts_after' => $user->ai_prompts_remaining
        ]);

        Log::info('Prompt used successfully', [
            'user_id' => $user->id,
            'service_type' => $serviceType,
            'prompts_used' => $count,
            'remaining' => $user->ai_prompts_remaining
        ]);

        return true;
    }

    /**
     * Add prompts to a user's account
     *
     * @param User $user
     * @param int $count
     * @return void
     */
    public function addPrompts(User $user, int $count): void
    {
        $user->increment('ai_prompts_remaining', $count);
        $user->increment('total_prompts_purchased', $count);
        $user->is_paid_user = true;
        $user->last_payment_date = now();
        $user->save();

        Log::info('Prompts added to user account', [
            'user_id' => $user->id,
            'prompts_added' => $count,
            'new_total' => $user->ai_prompts_remaining
        ]);
    }
}
