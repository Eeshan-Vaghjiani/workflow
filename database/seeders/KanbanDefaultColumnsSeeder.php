<?php

namespace Database\Seeders;

use App\Models\KanbanBoard;
use App\Models\KanbanColumn;
use Illuminate\Database\Seeder;

class KanbanDefaultColumnsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all boards without columns
        $boards = KanbanBoard::whereDoesntHave('columns')->get();

        foreach ($boards as $board) {
            // Default columns with colors and positions
            $columns = [
                [
                    'name' => 'Backlog',
                    'color' => '#64748B', // slate
                    'position' => 1,
                    'is_default' => true,
                ],
                [
                    'name' => 'To Do',
                    'color' => '#3B82F6', // blue
                    'position' => 2,
                    'is_default' => false,
                ],
                [
                    'name' => 'In Progress',
                    'color' => '#F59E0B', // amber
                    'position' => 3,
                    'is_default' => false,
                ],
                [
                    'name' => 'Review',
                    'color' => '#8B5CF6', // violet
                    'position' => 4,
                    'is_default' => false,
                ],
                [
                    'name' => 'Done',
                    'color' => '#10B981', // emerald
                    'position' => 5,
                    'is_default' => false,
                ],
            ];

            // Create columns for the board
            foreach ($columns as $column) {
                KanbanColumn::create([
                    'board_id' => $board->id,
                    'name' => $column['name'],
                    'color' => $column['color'],
                    'position' => $column['position'],
                    'is_default' => $column['is_default'],
                    'settings' => json_encode([]),
                ]);
            }
        }
    }
}
