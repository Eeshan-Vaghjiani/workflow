<?php

// Load Laravel application
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\KanbanBoard;
use App\Models\User;
use Illuminate\Support\Facades\Log;

// Script to create a test Kanban board
echo "Creating a test Kanban board...\n";

try {
    // Get the first user
    $user = User::first();
    if (!$user) {
        echo "Error: No users found in the database!\n";
        exit(1);
    }

    echo "Using user: {$user->name} (ID: {$user->id})\n";

    // Create the board
    $board = KanbanBoard::create([
        'name' => 'Test Board ' . date('Y-m-d H:i:s'),
        'description' => 'Created via direct script for debugging',
        'created_by' => $user->id,
        'is_active' => true,
        'settings' => ['test' => true],
    ]);

    echo "Created board ID: {$board->id}\n";

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
        echo "Created column: {$createdColumn->name}\n";
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
        echo "Created task: {$task->title}\n";
    }

    echo "Test Kanban board created successfully\n";
    echo "Board URL: http://localhost:8000/kanban/{$board->id}\n";
    
    exit(0);
} catch (\Exception $e) {
    echo "Error creating test board: {$e->getMessage()}\n";
    Log::error('Error in create_test_board.php script', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
    exit(1);
}
