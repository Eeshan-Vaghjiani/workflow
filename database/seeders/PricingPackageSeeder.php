<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\PricingPackage;

class PricingPackageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        PricingPackage::create([
            'name' => 'Basic',
            'description' => 'Perfect for students and individual users',
            'prompts_count' => 150,
            'price' => 1000,
            'currency' => 'KES',
            'is_active' => true,
            'sort_order' => 1,
            'features' => json_encode([
                'Access to all AI tools',
                '150 AI prompts',
                'Email support',
                'Valid for 30 days'
            ]),
            'is_popular' => false,
        ]);

        PricingPackage::create([
            'name' => 'Enterprise',
            'description' => 'Best for teams and professional use',
            'prompts_count' => 1000,
            'price' => 3000,
            'currency' => 'KES',
            'is_active' => true,
            'sort_order' => 2,
            'features' => json_encode([
                'Access to all AI tools',
                '1000 AI prompts',
                'Priority support',
                'Valid for 60 days',
                'Advanced AI features'
            ]),
            'is_popular' => true,
        ]);

        PricingPackage::create([
            'name' => 'Starter',
            'description' => 'Try out our AI tools with a small package',
            'prompts_count' => 50,
            'price' => 500,
            'currency' => 'KES',
            'is_active' => true,
            'sort_order' => 0,
            'features' => json_encode([
                'Access to basic AI tools',
                '50 AI prompts',
                'Email support',
                'Valid for 15 days'
            ]),
            'is_popular' => false,
        ]);
    }
}
