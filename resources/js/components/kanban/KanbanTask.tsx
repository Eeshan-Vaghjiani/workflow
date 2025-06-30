import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { KanbanTask as KanbanTaskType } from '@/types/kanban';
import {
    AlertCircle,
    Clock,
    Edit,
    User,
    Flag,
    Tag
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface KanbanTaskProps {
    task: KanbanTaskType;
    onEdit: () => void;
    className?: string;
}

export function KanbanTask({ task, onEdit, className }: KanbanTaskProps) {
    // Set up draggable for the task
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: task.id.toString(),
        data: {
            type: 'task',
            task,
        },
    });

    // Priority colors mapping
    const priorityColors = {
        low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
        urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };

    // Format due date display
    const formatDueDate = (dateString?: string) => {
        if (!dateString) return null;

        const dueDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Style based on due date
        let style = 'text-gray-600 dark:text-gray-400';
        if (daysUntilDue < 0) {
            style = 'text-red-500 dark:text-red-400 font-medium';
        } else if (daysUntilDue <= 1) {
            style = 'text-amber-500 dark:text-amber-400';
        }

        // Format date string
        let dateDisplay = format(dueDate, 'MMM d');
        if (dueDate.getTime() === today.getTime()) {
            dateDisplay = 'Today';
        } else if (dueDate.getTime() === tomorrow.getTime()) {
            dateDisplay = 'Tomorrow';
        }

        return (
            <div className={`flex items-center gap-1 text-xs ${style}`}>
                <Clock className="h-3 w-3" />
                <span>{dateDisplay}</span>
            </div>
        );
    };

    // Get initials from name
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={cn(
                'flex flex-col p-3 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm',
                'hover:border-gray-300 dark:hover:border-gray-600 cursor-grab',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50',
                isDragging && 'opacity-50',
                className
            )}
        >
            {/* Task Header */}
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-sm text-foreground line-clamp-2">{task.title}</h4>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                    className="h-6 w-6 p-0"
                >
                    <Edit className="h-3 w-3" />
                </Button>
            </div>

            {/* Task Description (if exists) */}
            {task.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
                    {task.description}
                </p>
            )}

            {/* Task Metadata */}
            <div className="mt-auto pt-2 flex flex-wrap gap-2 text-xs">
                {/* Priority Badge */}
                <Badge variant="outline" className={`px-2 py-1 ${priorityColors[task.priority]}`}>
                    <Flag className="h-3 w-3 mr-1" />
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </Badge>

                {/* Due Date */}
                {task.due_date && formatDueDate(task.due_date)}

                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Tag className="h-3 w-3" />
                        <span>{task.tags.length} {task.tags.length === 1 ? 'tag' : 'tags'}</span>
                    </div>
                )}
            </div>

            {/* Task Footer */}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                {/* Assigned User */}
                {task.assigned_user ? (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                            <AvatarImage src={task.assigned_user.avatar || ''} alt={task.assigned_user.name} />
                            <AvatarFallback className="text-[10px]">
                                {getInitials(task.assigned_user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                            {task.assigned_user.name}
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>Unassigned</span>
                    </div>
                )}

                {/* Attachments Counter */}
                {task.attachments && task.attachments.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3" />
                        <span>{task.attachments.length}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
