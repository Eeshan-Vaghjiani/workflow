<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create main test user
        User::create([
            'name' => 'Eva Ghjiani',
            'email' => 'evaghjiani@gmail.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        // Create additional test users
        $users = [
            [
                'name' => 'John Doe',
                'email' => 'john@example.com',
            ],
            [
                'name' => 'Jane Smith',
                'email' => 'jane@example.com',
            ],
            [
                'name' => 'Michael Johnson',
                'email' => 'michael@example.com',
            ],
            [
                'name' => 'Sarah Williams',
                'email' => 'sarah@example.com',
            ],
            [
                'name' => 'Dhruvin Bhudia',
                'email' => 'dhruvinbhudiael11@gmail.com',
            ],
        ];

        foreach ($users as $user) {
            User::create([
                'name' => $user['name'],
                'email' => $user['email'],
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]);
        }
    }
} 