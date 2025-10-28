<?php

namespace App\Services;

use App\Models\PricingPackage;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class PricingService
{
    /**
     * Get all active pricing packages
     *
     * @return Collection
     */
    public function getPackages(): Collection
    {
        return PricingPackage::where('is_active', true)
            ->orderBy('sort_order')
            ->get();
    }

    /**
     * Get a specific pricing package
     *
     * @param int $id
     * @return PricingPackage|null
     */
    public function getPackage(int $id): ?PricingPackage
    {
        return PricingPackage::where('is_active', true)
            ->where('id', $id)
            ->first();
    }

    /**
     * Process a package purchase
     *
     * @param User $user
     * @param int $packageId
     * @return array
     */
    public function processPurchase(User $user, int $packageId): array
    {
        $package = $this->getPackage($packageId);

        if (!$package) {
            Log::error('Package not found', ['package_id' => $packageId]);
            return [
                'success' => false,
                'message' => 'Package not found'
            ];
        }

        // Add prompts to user account
        app(PromptService::class)->addPrompts($user, $package->prompts_count);

        Log::info('Package purchased', [
            'user_id' => $user->id,
            'package_id' => $package->id,
            'prompts_added' => $package->prompts_count
        ]);

        return [
            'success' => true,
            'message' => 'Purchase successful',
            'prompts_added' => $package->prompts_count,
            'total_prompts' => $user->ai_prompts_remaining
        ];
    }
}
