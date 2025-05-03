<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\GroupAssignment;
use App\Models\User;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\GroupTask>
 */
class GroupTaskFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startDate = fake()->dateTimeBetween('now', '+1 week');
        $endDate = fake()->dateTimeBetween($startDate, '+2 weeks');

        return [
            'assignment_id' => GroupAssignment::factory(),
            'title' => fake()->sentence(),
            'assigned_to' => User::factory(),
            'start_date' => $startDate,
            'end_date' => $endDate,
            'status' => fake()->randomElement(['pending', 'in_progress', 'completed']),
            'priority' => fake()->randomElement(['low', 'medium', 'high']),
            'order_index' => fake()->numberBetween(1, 100),
            'description' => fake()->paragraph(),
        ];
    }
}
