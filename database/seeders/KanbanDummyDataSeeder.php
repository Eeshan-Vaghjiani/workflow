<?php

namespace Database\Seeders;

use App\Models\KanbanBoard;
use App\Models\KanbanColumn;
use App\Models\KanbanTask;
use App\Models\User;
use Illuminate\Database\Seeder;

class KanbanDummyDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get a user to assign as the creator
        $user = User::first();

        if (!$user) {
            $this->command->error('No users found. Please run the UserSeeder first.');
            return;
        }

        // Create dummy boards
        $boards = [
            [
                'name' => 'Project Alpha',
                'description' => 'Main development project board',
                'is_active' => true,
            ],
            [
                'name' => 'Marketing Campaign',
                'description' => 'Q3 marketing initiatives and tasks',
                'is_active' => true,
            ],
            [
                'name' => 'Personal Tasks',
                'description' => 'Personal to-do list and reminders',
                'is_active' => true,
            ],
        ];

        foreach ($boards as $boardData) {
            $board = KanbanBoard::create([
                'name' => $boardData['name'],
                'description' => $boardData['description'],
                'created_by' => $user->id,
                'is_active' => $boardData['is_active'],
                'settings' => json_encode([]),
            ]);

            // Create columns for each board
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

            $createdColumns = [];

            foreach ($columns as $columnData) {
                $column = KanbanColumn::create([
                    'board_id' => $board->id,
                    'name' => $columnData['name'],
                    'color' => $columnData['color'],
                    'position' => $columnData['position'],
                    'is_default' => $columnData['is_default'],
                    'settings' => json_encode([]),
                ]);

                $createdColumns[$columnData['name']] = $column;
            }

            // Create tasks for Project Alpha
            if ($board->name === 'Project Alpha') {
                $this->createTasksForProjectAlpha($board, $createdColumns, $user);
            }

            // Create tasks for Marketing Campaign
            if ($board->name === 'Marketing Campaign') {
                $this->createTasksForMarketingCampaign($board, $createdColumns, $user);
            }

            // Create tasks for Personal Tasks
            if ($board->name === 'Personal Tasks') {
                $this->createTasksForPersonalTasks($board, $createdColumns, $user);
            }
        }

        $this->command->info('Kanban dummy data created successfully!');
    }

    /**
     * Create tasks for Project Alpha board.
     */
    private function createTasksForProjectAlpha($board, $columns, $user): void
    {
        // Backlog tasks
        $backlogTasks = [
            [
                'title' => 'Research new technologies',
                'description' => 'Research and evaluate new technologies for future implementation',
                'priority' => 'medium',
                'position' => 1,
                'tags' => ['research', 'technology'],
            ],
            [
                'title' => 'Update documentation',
                'description' => 'Update project documentation with latest changes',
                'priority' => 'low',
                'position' => 2,
                'tags' => ['documentation'],
            ],
        ];

        foreach ($backlogTasks as $position => $taskData) {
            KanbanTask::create([
                'board_id' => $board->id,
                'column_id' => $columns['Backlog']->id,
                'title' => $taskData['title'],
                'description' => $taskData['description'],
                'priority' => $taskData['priority'],
                'created_by' => $user->id,
                'assigned_to' => $user->id,
                'position' => $position,
                'tags' => json_encode($taskData['tags']),
                'attachments' => json_encode([]),
            ]);
        }

        // To Do tasks
        $todoTasks = [
            [
                'title' => 'Design database schema',
                'description' => 'Create initial database schema for the project',
                'priority' => 'high',
                'position' => 1,
                'tags' => ['database', 'design'],
                'due_date' => now()->addDays(5)->format('Y-m-d'),
            ],
            [
                'title' => 'Set up CI/CD pipeline',
                'description' => 'Configure continuous integration and deployment pipeline',
                'priority' => 'medium',
                'position' => 2,
                'tags' => ['devops', 'automation'],
                'due_date' => now()->addDays(7)->format('Y-m-d'),
            ],
        ];

        foreach ($todoTasks as $position => $taskData) {
            KanbanTask::create([
                'board_id' => $board->id,
                'column_id' => $columns['To Do']->id,
                'title' => $taskData['title'],
                'description' => $taskData['description'],
                'priority' => $taskData['priority'],
                'created_by' => $user->id,
                'assigned_to' => $user->id,
                'due_date' => $taskData['due_date'] ?? null,
                'position' => $position,
                'tags' => json_encode($taskData['tags']),
                'attachments' => json_encode([]),
            ]);
        }

        // In Progress tasks
        $inProgressTasks = [
            [
                'title' => 'Implement user authentication',
                'description' => 'Implement user authentication using JWT',
                'priority' => 'high',
                'position' => 1,
                'tags' => ['auth', 'security'],
                'due_date' => now()->addDays(2)->format('Y-m-d'),
            ],
        ];

        foreach ($inProgressTasks as $position => $taskData) {
            KanbanTask::create([
                'board_id' => $board->id,
                'column_id' => $columns['In Progress']->id,
                'title' => $taskData['title'],
                'description' => $taskData['description'],
                'priority' => $taskData['priority'],
                'created_by' => $user->id,
                'assigned_to' => $user->id,
                'due_date' => $taskData['due_date'] ?? null,
                'position' => $position,
                'tags' => json_encode($taskData['tags']),
                'attachments' => json_encode([]),
            ]);
        }

        // Review tasks
        $reviewTasks = [
            [
                'title' => 'Code review: API endpoints',
                'description' => 'Review API endpoints for best practices and security',
                'priority' => 'urgent',
                'position' => 1,
                'tags' => ['review', 'api'],
                'due_date' => now()->addDay()->format('Y-m-d'),
            ],
        ];

        foreach ($reviewTasks as $position => $taskData) {
            KanbanTask::create([
                'board_id' => $board->id,
                'column_id' => $columns['Review']->id,
                'title' => $taskData['title'],
                'description' => $taskData['description'],
                'priority' => $taskData['priority'],
                'created_by' => $user->id,
                'assigned_to' => $user->id,
                'due_date' => $taskData['due_date'] ?? null,
                'position' => $position,
                'tags' => json_encode($taskData['tags']),
                'attachments' => json_encode([]),
            ]);
        }

        // Done tasks
        $doneTasks = [
            [
                'title' => 'Project setup',
                'description' => 'Initialize project repository and setup basic structure',
                'priority' => 'high',
                'position' => 1,
                'tags' => ['setup'],
            ],
            [
                'title' => 'Requirements gathering',
                'description' => 'Collect and document project requirements',
                'priority' => 'high',
                'position' => 2,
                'tags' => ['planning'],
            ],
        ];

        foreach ($doneTasks as $position => $taskData) {
            KanbanTask::create([
                'board_id' => $board->id,
                'column_id' => $columns['Done']->id,
                'title' => $taskData['title'],
                'description' => $taskData['description'],
                'priority' => $taskData['priority'],
                'created_by' => $user->id,
                'assigned_to' => $user->id,
                'position' => $position,
                'tags' => json_encode($taskData['tags']),
                'attachments' => json_encode([]),
            ]);
        }
    }

    /**
     * Create tasks for Marketing Campaign board.
     */
    private function createTasksForMarketingCampaign($board, $columns, $user): void
    {
        // Backlog tasks
        $backlogTasks = [
            [
                'title' => 'Research competitor campaigns',
                'description' => 'Analyze competitor marketing campaigns',
                'priority' => 'medium',
                'position' => 1,
                'tags' => ['research', 'competitors'],
            ],
            [
                'title' => 'Brainstorm campaign themes',
                'description' => 'Generate ideas for campaign themes and messaging',
                'priority' => 'low',
                'position' => 2,
                'tags' => ['brainstorming', 'creative'],
            ],
        ];

        foreach ($backlogTasks as $position => $taskData) {
            KanbanTask::create([
                'board_id' => $board->id,
                'column_id' => $columns['Backlog']->id,
                'title' => $taskData['title'],
                'description' => $taskData['description'],
                'priority' => $taskData['priority'],
                'created_by' => $user->id,
                'assigned_to' => $user->id,
                'position' => $position,
                'tags' => json_encode($taskData['tags']),
                'attachments' => json_encode([]),
            ]);
        }

        // To Do tasks
        $todoTasks = [
            [
                'title' => 'Create social media calendar',
                'description' => 'Develop content calendar for social media posts',
                'priority' => 'high',
                'position' => 1,
                'tags' => ['social media', 'planning'],
                'due_date' => now()->addDays(5)->format('Y-m-d'),
            ],
            [
                'title' => 'Design email templates',
                'description' => 'Design templates for email marketing campaign',
                'priority' => 'medium',
                'position' => 2,
                'tags' => ['design', 'email'],
                'due_date' => now()->addDays(7)->format('Y-m-d'),
            ],
        ];

        foreach ($todoTasks as $position => $taskData) {
            KanbanTask::create([
                'board_id' => $board->id,
                'column_id' => $columns['To Do']->id,
                'title' => $taskData['title'],
                'description' => $taskData['description'],
                'priority' => $taskData['priority'],
                'created_by' => $user->id,
                'assigned_to' => $user->id,
                'due_date' => $taskData['due_date'] ?? null,
                'position' => $position,
                'tags' => json_encode($taskData['tags']),
                'attachments' => json_encode([]),
            ]);
        }

        // In Progress tasks
        $inProgressTasks = [
            [
                'title' => 'Write blog post content',
                'description' => 'Create content for campaign blog posts',
                'priority' => 'high',
                'position' => 1,
                'tags' => ['content', 'writing'],
                'due_date' => now()->addDays(3)->format('Y-m-d'),
            ],
        ];

        foreach ($inProgressTasks as $position => $taskData) {
            KanbanTask::create([
                'board_id' => $board->id,
                'column_id' => $columns['In Progress']->id,
                'title' => $taskData['title'],
                'description' => $taskData['description'],
                'priority' => $taskData['priority'],
                'created_by' => $user->id,
                'assigned_to' => $user->id,
                'due_date' => $taskData['due_date'] ?? null,
                'position' => $position,
                'tags' => json_encode($taskData['tags']),
                'attachments' => json_encode([]),
            ]);
        }
    }

    /**
     * Create tasks for Personal Tasks board.
     */
    private function createTasksForPersonalTasks($board, $columns, $user): void
    {
        // Backlog tasks
        $backlogTasks = [
            [
                'title' => 'Learn a new programming language',
                'description' => 'Start learning Rust programming language',
                'priority' => 'low',
                'position' => 1,
                'tags' => ['learning', 'programming'],
            ],
            [
                'title' => 'Read "Clean Code" book',
                'description' => 'Finish reading Clean Code by Robert C. Martin',
                'priority' => 'medium',
                'position' => 2,
                'tags' => ['reading', 'self-improvement'],
            ],
        ];

        foreach ($backlogTasks as $position => $taskData) {
            KanbanTask::create([
                'board_id' => $board->id,
                'column_id' => $columns['Backlog']->id,
                'title' => $taskData['title'],
                'description' => $taskData['description'],
                'priority' => $taskData['priority'],
                'created_by' => $user->id,
                'assigned_to' => $user->id,
                'position' => $position,
                'tags' => json_encode($taskData['tags']),
                'attachments' => json_encode([]),
            ]);
        }

        // To Do tasks
        $todoTasks = [
            [
                'title' => 'Pay monthly bills',
                'description' => 'Pay electricity, internet and water bills',
                'priority' => 'high',
                'position' => 1,
                'tags' => ['finance', 'bills'],
                'due_date' => now()->addDays(2)->format('Y-m-d'),
            ],
            [
                'title' => 'Schedule dentist appointment',
                'description' => 'Call dentist office to schedule annual checkup',
                'priority' => 'medium',
                'position' => 2,
                'tags' => ['health', 'appointment'],
                'due_date' => now()->addDays(5)->format('Y-m-d'),
            ],
        ];

        foreach ($todoTasks as $position => $taskData) {
            KanbanTask::create([
                'board_id' => $board->id,
                'column_id' => $columns['To Do']->id,
                'title' => $taskData['title'],
                'description' => $taskData['description'],
                'priority' => $taskData['priority'],
                'created_by' => $user->id,
                'assigned_to' => $user->id,
                'due_date' => $taskData['due_date'] ?? null,
                'position' => $position,
                'tags' => json_encode($taskData['tags']),
                'attachments' => json_encode([]),
            ]);
        }

        // In Progress tasks
        $inProgressTasks = [
            [
                'title' => 'Prepare presentation for meeting',
                'description' => 'Create slides for next week\'s team meeting',
                'priority' => 'urgent',
                'position' => 1,
                'tags' => ['work', 'presentation'],
                'due_date' => now()->addDay()->format('Y-m-d'),
            ],
        ];

        foreach ($inProgressTasks as $position => $taskData) {
            KanbanTask::create([
                'board_id' => $board->id,
                'column_id' => $columns['In Progress']->id,
                'title' => $taskData['title'],
                'description' => $taskData['description'],
                'priority' => $taskData['priority'],
                'created_by' => $user->id,
                'assigned_to' => $user->id,
                'due_date' => $taskData['due_date'] ?? null,
                'position' => $position,
                'tags' => json_encode($taskData['tags']),
                'attachments' => json_encode([]),
            ]);
        }

        // Done tasks
        $doneTasks = [
            [
                'title' => 'Update resume',
                'description' => 'Update resume with recent experience and skills',
                'priority' => 'medium',
                'position' => 1,
                'tags' => ['career'],
            ],
            [
                'title' => 'Buy groceries',
                'description' => 'Purchase weekly groceries from the store',
                'priority' => 'high',
                'position' => 2,
                'tags' => ['shopping', 'household'],
            ],
        ];

        foreach ($doneTasks as $position => $taskData) {
            KanbanTask::create([
                'board_id' => $board->id,
                'column_id' => $columns['Done']->id,
                'title' => $taskData['title'],
                'description' => $taskData['description'],
                'priority' => $taskData['priority'],
                'created_by' => $user->id,
                'assigned_to' => $user->id,
                'position' => $position,
                'tags' => json_encode($taskData['tags']),
                'attachments' => json_encode([]),
            ]);
        }
    }
}
