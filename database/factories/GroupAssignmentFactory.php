<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Group;
use App\Models\User;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\GroupAssignment>
 */
class GroupAssignmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'group_id' => Group::factory(),
            'title' => fake()->sentence(),
            'unit_name' => fake()->word(),
            'priority' => fake()->randomElement(['low', 'medium', 'high']),
            'due_date' => fake()->dateTimeBetween('now', '+1 month'),
            'description' => fake()->paragraph(),
            'created_by' => User::factory(),
        ];
    }
}
