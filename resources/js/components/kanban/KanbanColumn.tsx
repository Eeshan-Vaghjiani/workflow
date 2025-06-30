import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { KanbanTask } from './KanbanTask';
import { KanbanColumn as KanbanColumnType, KanbanTask as KanbanTaskType } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
    column: KanbanColumnType;
    onAddTask: () => void;
    onEditTask: (task: KanbanTaskType) => void;
}

export function KanbanColumn({ column, onAddTask, onEditTask }: KanbanColumnProps) {
    // Set up droppable area for the column
    const { setNodeRef, isOver } = useDroppable({
        id: `column-${column.id}`,
        data: {
            type: 'column',
            column,
        },
    });

    // Get tasks sorted by position
    const sortedTasks = [...column.tasks].sort((a, b) => a.position - b.position);

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col w-[350px] flex-shrink-0 rounded-md overflow-hidden bg-gray-50 dark:bg-gray-800 ${isOver ? 'ring-2 ring-primary ring-opacity-50' : ''
                }`}
            style={{
                borderLeft: `4px solid ${column.color}`,
            }}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">{column.name}</h3>
                    <span className="flex items-center justify-center h-5 min-w-[20px] rounded-full bg-gray-200 dark:bg-gray-700 text-xs px-1.5">
                        {sortedTasks.length}
                    </span>
                </div>
                <Button
                    onClick={onAddTask}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            {/* Task List */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-250px)]">
                {sortedTasks.length > 0 ? (
                    sortedTasks.map((task) => (
                        <KanbanTask
                            key={task.id}
                            task={task}
                            onEdit={() => onEditTask(task)}
                        />
                    ))
                ) : (
                    <div className="flex items-center justify-center h-24 border border-dashed border-gray-300 dark:border-gray-600 rounded-md">
                        <p className="text-sm text-muted-foreground">No tasks</p>
                    </div>
                )}
            </div>
        </div>
    );
}
