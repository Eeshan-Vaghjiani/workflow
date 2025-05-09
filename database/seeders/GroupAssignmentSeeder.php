<?php

namespace Database\Seeders;

use App\Models\Group;
use App\Models\GroupAssignment;
use App\Models\GroupTask;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class GroupAssignmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all groups with their members
        $groups = Group::with('members')->get();
        
        // Define sample assignments
        $sampleAssignments = [
            [
                'title' => 'Website Redesign',
                'description' => 'Complete overhaul of the company website to improve UX and conversion rates',
                'unit_name' => 'Design',
                'priority' => 'high',
            ],
            [
                'title' => 'Marketing Campaign',
                'description' => 'Create and launch Q3 marketing campaign for our flagship product',
                'unit_name' => 'Marketing',
                'priority' => 'medium',
            ],
            [
                'title' => 'API Integration',
                'description' => 'Integrate third-party payment gateway API into our platform',
                'unit_name' => 'Development',
                'priority' => 'high',
            ],
            [
                'title' => 'Documentation Update',
                'description' => 'Update all user documentation to reflect latest features',
                'unit_name' => 'Support',
                'priority' => 'low',
            ],
            [
                'title' => 'User Testing',
                'description' => 'Conduct usability testing with a focus group of 10-15 users',
                'unit_name' => 'QA',
                'priority' => 'medium',
            ],
        ];
        
        // Sample tasks
        $sampleTasks = [
            [
                'title' => 'Research competitors',
                'description' => 'Analyze main competitors and identify opportunities',
                'status' => 'completed',
                'priority' => 'medium',
            ],
            [
                'title' => 'Create wireframes',
                'description' => 'Design initial wireframes for key pages',
                'status' => 'in_progress',
                'priority' => 'high',
            ],
            [
                'title' => 'Set up development environment',
                'description' => 'Configure local development stack',
                'status' => 'completed',
                'priority' => 'medium',
            ],
            [
                'title' => 'Implement frontend components',
                'description' => 'Build reusable UI components for the application',
                'status' => 'pending',
                'priority' => 'high',
            ],
            [
                'title' => 'Write unit tests',
                'description' => 'Create comprehensive test suite',
                'status' => 'pending',
                'priority' => 'medium',
            ],
            [
                'title' => 'Content creation',
                'description' => 'Write copy for all pages',
                'status' => 'in_progress',
                'priority' => 'medium',
            ],
            [
                'title' => 'User interviews',
                'description' => 'Conduct interviews with key stakeholders',
                'status' => 'completed',
                'priority' => 'low',
            ],
            [
                'title' => 'Database migration',
                'description' => 'Plan and execute database structure updates',
                'status' => 'pending',
                'priority' => 'high',
            ],
            [
                'title' => 'Create social media assets',
                'description' => 'Design graphics for social media campaign',
                'status' => 'in_progress',
                'priority' => 'medium',
            ],
            [
                'title' => 'Security audit',
                'description' => 'Review code for security vulnerabilities',
                'status' => 'pending',
                'priority' => 'high',
            ],
        ];
        
        foreach ($groups as $group) {
            // Determine how many assignments to create (1-3)
            $assignmentCount = rand(1, 3);
            
            // Shuffle assignments to get random ones
            $shuffledAssignments = collect($sampleAssignments)->shuffle();
            
            for ($i = 0; $i < $assignmentCount; $i++) {
                // Get assignment data
                $assignmentData = $shuffledAssignments[$i] ?? $shuffledAssignments[0];
                
                // Set due date (between now and 30 days from now)
                $dueDate = Carbon::now()->addDays(rand(7, 30));
                
                // Create the assignment
                $assignment = GroupAssignment::create([
                    'group_id' => $group->id,
                    'title' => $assignmentData['title'],
                    'description' => $assignmentData['description'],
                    'unit_name' => $assignmentData['unit_name'],
                    'priority' => $assignmentData['priority'],
                    'due_date' => $dueDate,
                    'created_by' => $group->owner_id,
                ]);
                
                // Create 3-6 tasks for each assignment
                $taskCount = rand(3, 6);
                $shuffledTasks = collect($sampleTasks)->shuffle();
                
                for ($j = 0; $j < $taskCount; $j++) {
                    $taskData = $shuffledTasks[$j] ?? $shuffledTasks[$j % count($sampleTasks)];
                    
                    // Assign to a random group member
                    $assignedTo = $group->members->random()->id;
                    
                    // Set task dates (start between now and due date, end between start and due date)
                    $startDate = Carbon::now()->addDays(rand(0, 5));
                    $endDate = (clone $startDate)->addDays(rand(1, max(1, $dueDate->diffInDays($startDate))));
                    
                    // Create the task
                    GroupTask::create([
                        'assignment_id' => $assignment->id,
                        'title' => $taskData['title'],
                        'description' => $taskData['description'],
                        'assigned_to' => $assignedTo,
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                        'status' => $taskData['status'],
                        'priority' => $taskData['priority'],
                        'created_by' => $group->owner_id,
                        'order_index' => $j,
                    ]);
                }
            }
        }
    }
} 