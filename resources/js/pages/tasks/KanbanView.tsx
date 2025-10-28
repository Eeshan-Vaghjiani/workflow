import { Head } from '@inertiajs/react';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import KanbanBoard from '@/components/tasks/KanbanBoard';
import { Button } from '@/components/ui/button';
import { ListFilter, LayoutGrid, List, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Task {
    id: number;
    title: string;
    description: string | null;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    start_date: string;
    end_date: string;
    assigned_user_id: number | null;
    assigned_user?: {
        id: number;
        name: string;
        avatar?: string;
    };
    assignment?: {
        id: number;
        title: string;
        group?: {
            id: number;
            name: string;
        };
    };
    importance?: number;
    effort_hours?: number;
}

interface Props {
    tasks: Task[];
    groupId?: number;
    assignmentId?: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tasks',
        href: '/tasks',
    },
    {
        title: 'Kanban View',
        href: '/tasks/kanban',
    },
];

export default function KanbanView({ tasks, groupId, assignmentId }: Props) {
    const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
    const [filter, setFilter] = useState({
        priority: {
            low: true,
            medium: true,
            high: true
        },
        assigned: {
            assigned: true,
            unassigned: true
        }
    });

    // Apply filters to tasks
    const filteredTasks = localTasks.filter(task => {
        // Priority filter
        if (!filter.priority[task.priority]) {
            return false;
        }

        // Assignment filter
        if (task.assigned_user_id && !filter.assigned.assigned) {
            return false;
        }
        if (!task.assigned_user_id && !filter.assigned.unassigned) {
            return false;
        }

        return true;
    });

    const priorityCounts = {
        low: localTasks.filter(task => task.priority === 'low').length,
        medium: localTasks.filter(task => task.priority === 'medium').length,
        high: localTasks.filter(task => task.priority === 'high').length
    };

    const assignmentCounts = {
        assigned: localTasks.filter(task => task.assigned_user_id !== null).length,
        unassigned: localTasks.filter(task => task.assigned_user_id === null).length
    };

    const handleTaskUpdate = async (taskId: number, status: string) => {
        // Optimistically update local state
        const updatedTasks = localTasks.map(task =>
            task.id === taskId ? { ...task, status: status as 'pending' | 'in_progress' | 'completed' } : task
        );
        setLocalTasks(updatedTasks);
    };

    const goToListView = () => {
        window.location.href = '/tasks';
    };

    const handleCreateTask = () => {
        let url = '/group-tasks/create';
        if (groupId && assignmentId) {
            url += `?group=${groupId}&assignment=${assignmentId}`;
        }
        window.location.href = url;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Task Kanban View" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Tasks - Kanban View</h1>
                    <div className="flex gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="flex items-center gap-1">
                                    <ListFilter className="h-4 w-4" />
                                    Filter
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="end">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium">Priority</h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="priority-high"
                                                    checked={filter.priority.high}
                                                    onCheckedChange={(checked) =>
                                                        setFilter({
                                                            ...filter,
                                                            priority: {
                                                                ...filter.priority,
                                                                high: !!checked
                                                            }
                                                        })
                                                    }
                                                />
                                                <Label htmlFor="priority-high" className="flex items-center gap-2">
                                                    High
                                                    <Badge variant="outline">{priorityCounts.high}</Badge>
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="priority-medium"
                                                    checked={filter.priority.medium}
                                                    onCheckedChange={(checked) =>
                                                        setFilter({
                                                            ...filter,
                                                            priority: {
                                                                ...filter.priority,
                                                                medium: !!checked
                                                            }
                                                        })
                                                    }
                                                />
                                                <Label htmlFor="priority-medium" className="flex items-center gap-2">
                                                    Medium
                                                    <Badge variant="outline">{priorityCounts.medium}</Badge>
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="priority-low"
                                                    checked={filter.priority.low}
                                                    onCheckedChange={(checked) =>
                                                        setFilter({
                                                            ...filter,
                                                            priority: {
                                                                ...filter.priority,
                                                                low: !!checked
                                                            }
                                                        })
                                                    }
                                                />
                                                <Label htmlFor="priority-low" className="flex items-center gap-2">
                                                    Low
                                                    <Badge variant="outline">{priorityCounts.low}</Badge>
                                                </Label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-medium">Assignment</h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="assigned"
                                                    checked={filter.assigned.assigned}
                                                    onCheckedChange={(checked) =>
                                                        setFilter({
                                                            ...filter,
                                                            assigned: {
                                                                ...filter.assigned,
                                                                assigned: !!checked
                                                            }
                                                        })
                                                    }
                                                />
                                                <Label htmlFor="assigned" className="flex items-center gap-2">
                                                    Assigned
                                                    <Badge variant="outline">{assignmentCounts.assigned}</Badge>
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="unassigned"
                                                    checked={filter.assigned.unassigned}
                                                    onCheckedChange={(checked) =>
                                                        setFilter({
                                                            ...filter,
                                                            assigned: {
                                                                ...filter.assigned,
                                                                unassigned: !!checked
                                                            }
                                                        })
                                                    }
                                                />
                                                <Label htmlFor="unassigned" className="flex items-center gap-2">
                                                    Unassigned
                                                    <Badge variant="outline">{assignmentCounts.unassigned}</Badge>
                                                </Label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Button variant="outline" size="sm" onClick={goToListView} className="flex items-center gap-1">
                            <List className="h-4 w-4" />
                            List View
                        </Button>
                        <Button onClick={handleCreateTask} className="flex items-center gap-1">
                            <Plus className="h-4 w-4" />
                            Create Task
                        </Button>
                    </div>
                </div>

                {filteredTasks.length > 0 ? (
                    <KanbanBoard tasks={filteredTasks} onTaskUpdate={handleTaskUpdate} />
                ) : (
                    <div className="flex h-96 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
                        <LayoutGrid className="h-10 w-10 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No Tasks Found</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {Object.values(filter.priority).some(v => v) && Object.values(filter.assigned).some(v => v)
                                ? "Create a new task to start organizing your work."
                                : "Adjust your filters to see more tasks."}
                        </p>
                        {Object.values(filter.priority).some(v => v) && Object.values(filter.assigned).some(v => v) && (
                            <Button className="mt-4" onClick={handleCreateTask}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Task
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
