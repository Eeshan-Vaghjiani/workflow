<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\GroupAssignment;
use App\Models\GroupTask;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $groups = Group::whereHas('members', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->withCount(['members', 'assignments'])->get();

        $assignments = GroupAssignment::whereHas('group.members', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->with('group')->latest()->take(5)->get();
        
        // Filter out any assignments with null groups
        $assignments = $assignments->filter(function ($assignment) {
            return $assignment->group !== null;
        });

        $tasks = GroupTask::whereHas('assignment.group.members', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->with(['assignment', 'assignment.group'])->latest()->take(5)->get();
        
        // Filter out any tasks with null assignments or groups
        $tasks = $tasks->filter(function ($task) {
            return $task->assignment !== null && $task->assignment->group !== null;
        });

        // Get unread notifications count
        $unreadNotificationsCount = $user->notifications()->where('read', false)->count();

        return Inertia::render('Dashboard', [
            'groups' => $groups,
            'assignments' => $assignments,
            'tasks' => $tasks,
            'unreadNotificationsCount' => $unreadNotificationsCount,
        ]);
    }

    public function tasks()
    {
        $user = request()->user();

        $tasks = \App\Models\GroupTask::whereHas('assignment.group.members', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->with(['assignment', 'assignment.group'])->latest()->get();

        // Filter out any tasks with null assignments or groups
        $tasks = $tasks->filter(function ($task) {
            return $task->assignment !== null && $task->assignment->group !== null;
        });

        return Inertia::render('tasks/Index', [
            'tasks' => $tasks,
        ]);
    }

    public function calendar()
    {
        $user = request()->user();

        // Get all tasks for the user
        $tasksQuery = GroupTask::whereHas('assignment.group.members', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->with(['assignment', 'assignment.group']);
        
        $tasks = $tasksQuery->get();
        
        // Filter out tasks with null relationships
        $tasks = $tasks->filter(function ($task) {
            return $task->assignment !== null && $task->assignment->group !== null;
        })
        ->map(function ($task) {
            return [
                'id' => $task->id,
                'title' => $task->title,
                'start' => $task->start_date->format('Y-m-d'),
                'end' => $task->end_date->format('Y-m-d'),
                'extendedProps' => [
                    'assignment' => $task->assignment->title,
                    'group' => $task->assignment->group->name,
                    'priority' => $task->priority,
                    'status' => $task->status,
                ],
                'backgroundColor' => $task->priority === 'high' ? '#f87171' : ($task->priority === 'medium' ? '#fbbf24' : '#60a5fa'),
                'borderColor' => $task->priority === 'high' ? '#ef4444' : ($task->priority === 'medium' ? '#f59e0b' : '#3b82f6'),
                'url' => route('group-tasks.show', [
                    'group' => $task->assignment->group_id,
                    'assignment' => $task->assignment_id,
                    'task' => $task->id
                ]),
            ];
        });

        // Get all assignments for the user
        $assignmentsQuery = GroupAssignment::whereHas('group.members', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->with('group');
        
        $assignments = $assignmentsQuery->get();
        
        // Filter out assignments with null relationships
        $assignments = $assignments->filter(function ($assignment) {
            return $assignment->group !== null;
        })
        ->map(function ($assignment) {
            return [
                'id' => 'assignment-' . $assignment->id,
                'title' => $assignment->title . ' (Assignment)',
                'start' => $assignment->due_date->format('Y-m-d'),
                'end' => $assignment->due_date->format('Y-m-d'),
                'allDay' => true,
                'extendedProps' => [
                    'type' => 'assignment',
                    'group' => $assignment->group->name,
                    'priority' => $assignment->priority,
                ],
                'backgroundColor' => '#10b981',
                'borderColor' => '#059669',
                'url' => route('group-assignments.show', [
                    'group' => $assignment->group_id,
                    'assignment' => $assignment->id
                ]),
            ];
        });

        // Combine tasks and assignments into a single array
        $events = $tasks->concat($assignments);

        return Inertia::render('Dashboard/Calendar', [
            'events' => $events,
        ]);
    }

    public function gantt()
    {
        $user = request()->user();

        // Get all tasks for the user with start and end dates
        $tasksQuery = GroupTask::whereHas('assignment.group.members', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->with(['assignment', 'assignment.group', 'assignedUser']);
        
        $tasks = $tasksQuery->get();
        
        // Filter out tasks with null relationships
        $tasks = $tasks->filter(function ($task) {
            return $task->assignment !== null && 
                   $task->assignment->group !== null && 
                   $task->assignedUser !== null;
        })
        ->map(function ($task) {
            return [
                'id' => (string) $task->id,
                'name' => $task->title,
                'start' => $task->start_date->format('Y-m-d'),
                'end' => $task->end_date->format('Y-m-d'),
                'progress' => $task->status === 'completed' ? 100 : ($task->status === 'in_progress' ? 50 : 0),
                'type' => 'task',
                'hideChildren' => false,
                'displayOrder' => $task->order_index,
                'assignedTo' => $task->assignedUser->name,
                'assignmentTitle' => $task->assignment->title,
                'groupName' => $task->assignment->group->name,
                'priority' => $task->priority,
                'dependencies' => [],
                'styles' => [
                    'backgroundColor' => $task->priority === 'high' ? '#f87171' : ($task->priority === 'medium' ? '#fbbf24' : '#60a5fa'),
                    'progressColor' => $task->priority === 'high' ? '#ef4444' : ($task->priority === 'medium' ? '#f59e0b' : '#3b82f6'),
                ],
            ];
        });

        // Group tasks by assignment
        $tasksByAssignment = $tasks->groupBy('assignmentTitle');
        
        // Create a hierarchical structure for the Gantt chart
        $ganttTasks = collect();
        
        foreach ($tasksByAssignment as $assignmentTitle => $assignmentTasks) {
            if ($assignmentTasks->isEmpty()) continue;
            
            // Add the assignment as a parent task
            $firstTask = $assignmentTasks->first();
            if ($firstTask) {
                $ganttTasks->push([
                    'id' => 'assignment-' . $firstTask['assignmentTitle'],
                    'name' => $assignmentTitle,
                    'start' => $assignmentTasks->min('start'),
                    'end' => $assignmentTasks->max('end'),
                    'progress' => 0,
                    'type' => 'project',
                    'hideChildren' => false,
                    'displayOrder' => 0,
                    'assignedTo' => '',
                    'groupName' => $firstTask['groupName'],
                    'dependencies' => [],
                ]);
                
                // Add the tasks as children
                foreach ($assignmentTasks as $task) {
                    $task['dependencies'] = ['assignment-' . $firstTask['assignmentTitle']];
                    $ganttTasks->push($task);
                }
            }
        }

        return Inertia::render('Dashboard/Gantt', [
            'tasks' => $ganttTasks,
        ]);
    }
} 