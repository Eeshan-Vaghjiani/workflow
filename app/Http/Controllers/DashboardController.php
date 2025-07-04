<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\GroupAssignment;
use App\Models\GroupTask;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $groups = Group::whereHas('members', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->withCount(['members', 'assignments'])->get();

        // Add last message data for groups
        $groups = $groups->map(function($group) use ($user) {
            // Get the latest message for the group
            $lastMessage = $group->chatMessages()->with('user:id,name')->latest()->first();

            // Get messages count from other users in last 24 hours as a simple way to show "unread" messages
            // This is a simplified approach that doesn't require tracking read status
            $unreadCount = $group->chatMessages()
                ->where('created_at', '>=', now()->subDay())
                ->where('user_id', '!=', $user->id)
                ->count();

            $group->lastMessage = $lastMessage ? [
                'content' => $lastMessage->message,
                'timestamp' => $lastMessage->created_at->diffForHumans(),
            ] : null;

            $group->unreadCount = $unreadCount;

            return $group;
        });

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

        return Inertia::render('dashboard', [
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
        $user = Auth::user();
        $tasks = GroupTask::whereHas('assignment.group.members', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->with(['assignment', 'assignment.group', 'assigned_user'])
        ->get()
        ->map(function ($task) {
            return [
                'id' => $task->id,
                'title' => $task->title,
                'start' => $task->start_date,
                'end' => $task->end_date,
                'allDay' => true,
                'backgroundColor' => $this->getPriorityColor($task->priority),
                'borderColor' => $this->getPriorityColor($task->priority),
                'textColor' => '#ffffff',
                'extendedProps' => [
                    'assignment' => $task->assignment->title,
                    'group' => $task->assignment->group->name,
                    'priority' => $task->priority,
                    'status' => $task->status,
                    'type' => 'task'
                ]
            ];
        });

        return Inertia::render('dashboard/Calendar', [
            'events' => $tasks
        ]);
    }

    private function getPriorityColor($priority)
    {
        switch ($priority) {
            case 'high':
                return '#ef4444'; // red-500
            case 'medium':
                return '#f59e0b'; // amber-500
            case 'low':
                return '#3b82f6'; // blue-500
            default:
                return '#6b7280'; // gray-500
        }
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

        // Get all assignments for the dropdown
        $assignments = GroupAssignment::whereHas('group.members', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->with('group')
        ->get()
        ->filter(function ($assignment) {
            return $assignment->group !== null;
        })
        ->map(function ($assignment) {
            return [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'group_id' => $assignment->group_id,
                'group_name' => $assignment->group->name,
            ];
        });

        // Get all group members for the dropdown (from groups the user is a member of)
        $groupMembersQuery = \App\Models\User::whereHas('groups', function ($query) use ($user) {
            $query->whereIn('group_id', function ($subquery) use ($user) {
                $subquery->select('group_id')
                    ->from('group_user')
                    ->where('user_id', $user->id);
            });
        });

        $groupMembers = $groupMembersQuery->get()
            ->map(function ($member) {
                return [
                    'id' => $member->id,
                    'name' => $member->name,
                ];
            });

        return Inertia::render('dashboard/Gantt', [
            'tasks' => $ganttTasks,
            'assignments' => $assignments,
            'groupMembers' => $groupMembers,
        ]);
    }
}
