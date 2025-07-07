<?php

namespace App\Console\Commands;

use App\Models\KanbanBoard;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CreateTestKanbanBoard extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kanban:create-test-board {user_id? : The ID of the user to create the board for}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a test Kanban board for debugging';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            // Get user ID from argument or prompt for it
            $userId = $this->argument('user_id');
            if (!$userId) {
                $userId = $this->ask('Enter the user ID to create the board for');
            }

            // Validate user exists
            $user = User::find($userId);
            if (!$user) {
                $this->error("User with ID {$userId} not found");
                return 1;
            }

            // Create the board
            $board = KanbanBoard::create([
                'name' => 'Test Board ' . now()->format('Y-m-d H:i'),
                'description' => 'Created via console command for debugging',
                'created_by' => $user->id,
                'is_active' => true,
                'settings' => ['test' => true],
            ]);

            $this->info("Created board ID: {$board->id}");

            // Create default columns
            $columns = [
                ['name' => 'To Do', 'color' => '#3B82F6', 'position' => 1, 'is_default' => true],
                ['name' => 'In Progress', 'color' => '#F59E0B', 'position' => 2, 'is_default' => false],
                ['name' => 'Done', 'color' => '#10B981', 'position' => 3, 'is_default' => false],
            ];

            foreach ($columns as $column) {
                $createdColumn = $board->columns()->create([
                    'name' => $column['name'],
                    'color' => $column['color'],
                    'position' => $column['position'],
                    'is_default' => $column['is_default'],
                    'settings' => [],
                ]);
                $this->info("Created column: {$createdColumn->name}");
            }

            // Create a sample task
            $defaultColumn = $board->columns()->where('is_default', true)->first();
            if ($defaultColumn) {
                $task = $defaultColumn->tasks()->create([
                    'title' => 'Sample Task',
                    'description' => 'This is a sample task for testing',
                    'position' => 1,
                    'created_by' => $user->id,
                    'due_date' => now()->addDays(7),
                    'priority' => 'medium',
                    'status' => 'pending',
                    'board_id' => $board->id,
                ]);
                $this->info("Created task: {$task->title}");
            }

            $this->info('Test Kanban board created successfully');
            $this->info("Board URL: " . url("/kanban/{$board->id}"));
            
            return 0;
        } catch (\Exception $e) {
            $this->error('Error creating test board: ' . $e->getMessage());
            Log::error('Error in CreateTestKanbanBoard command', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return 1;
        }
    }
}
