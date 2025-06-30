import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { KanbanTask as TaskComponent } from './KanbanTask';
import { Button } from '@/components/ui/button';
import { KanbanBoard as KanbanBoardType, KanbanColumn as KanbanColumnType, KanbanTask as KanbanTaskType } from '@/types/kanban';
import { KanbanService } from '@/services/kanban-service';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AddColumnDialog } from './dialogs/AddColumnDialog';
import { TaskModal } from './dialogs/TaskModal';

interface KanbanBoardProps {
    boardId: number;
}

export function KanbanBoard({ boardId }: KanbanBoardProps) {
    const [board, setBoard] = useState<KanbanBoardType | null>(null);
    const [columns, setColumns] = useState<KanbanColumnType[]>([]);
    const [activeTask, setActiveTask] = useState<KanbanTaskType | null>(null);
    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState<KanbanTaskType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    // Configure sensors for drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Fetch board data with columns and tasks
    const fetchBoard = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await KanbanService.getBoard(boardId);
            setBoard(data);
            setColumns(data.columns);
            setIsLoading(false);
        } catch (err) {
            console.error('Error fetching board:', err);
            setError('Failed to load board data');
            setIsLoading(false);
        }
    }, [boardId]);

    useEffect(() => {
        fetchBoard();
    }, [fetchBoard]);

    // Handle task drag end
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        // Extract task and column data from the event
        const taskId = active.id.toString();
        const task = active.data.current?.task as KanbanTaskType;
        const targetColumnId = parseInt(over.id.toString().split('-')[1]);

        // If task is dropped in the same column
        if (task.column_id === targetColumnId) {
            return;
        }

        // Find target column
        const targetColumn = columns.find(col => col.id === targetColumnId);
        if (!targetColumn) return;

        // Optimistic UI update
        const updatedColumns = columns.map(col => {
            // Remove task from source column
            if (col.id === task.column_id) {
                return {
                    ...col,
                    tasks: col.tasks.filter(t => t.id !== task.id)
                };
            }

            // Add task to target column
            if (col.id === targetColumnId) {
                const updatedTask = {
                    ...task,
                    column_id: targetColumnId,
                    position: targetColumn.tasks.length // Set position to end of column
                };

                return {
                    ...col,
                    tasks: [...col.tasks, updatedTask]
                };
            }

            return col;
        });

        // Update state optimistically
        setColumns(updatedColumns);
        setActiveTask(null);

        try {
            // Call API to update task position
            await KanbanService.moveTask(
                parseInt(taskId),
                targetColumnId,
                targetColumn.tasks.length
            );
        } catch (error) {
            console.error('Error moving task:', error);
            toast({
                title: 'Error moving task',
                description: 'Could not move task to the new column',
                variant: 'destructive',
            });

            // Revert to previous state on error
            fetchBoard();
        }
    };

    // Handle task drag start
    const handleDragStart = (event: DragEndEvent) => {
        const { active } = event;
        const taskId = active.id.toString();

        // Find the task in columns
        for (const column of columns) {
            const foundTask = column.tasks.find(task => task.id.toString() === taskId);
            if (foundTask) {
                setActiveTask(foundTask);
                break;
            }
        }
    };

    // Handle adding a new column
    const handleAddColumn = async (columnData: Partial<KanbanColumnType>) => {
        try {
            const newColumn = await KanbanService.createColumn({
                ...columnData,
                board_id: boardId,
                position: columns.length,
            });

            setColumns([...columns, { ...newColumn, tasks: [] }]);
            setIsAddColumnOpen(false);

            toast({
                title: 'Column added',
                description: 'New column has been added successfully',
            });
        } catch (error) {
            console.error('Error adding column:', error);
            toast({
                title: 'Error adding column',
                description: 'Could not add the new column',
                variant: 'destructive',
            });
        }
    };

    // Handle adding a new task
    const handleAddTask = (columnId: number) => {
        const column = columns.find(col => col.id === columnId);
        if (!column) return;

        setCurrentTask({
            id: 0,
            board_id: boardId,
            column_id: columnId,
            title: '',
            description: '',
            priority: 'medium',
            created_by: 0,
            position: column.tasks.length,
            tags: [],
            attachments: [],
        });

        setIsTaskModalOpen(true);
    };

    // Handle editing a task
    const handleEditTask = (task: KanbanTaskType) => {
        setCurrentTask(task);
        setIsTaskModalOpen(true);
    };

    // Handle saving a task (create or update)
    const handleSaveTask = async (taskData: Partial<KanbanTaskType>) => {
        try {
            if (currentTask?.id) {
                // Update existing task
                const updatedTask = await KanbanService.updateTask(currentTask.id, taskData);

                // Update state
                setColumns(columns.map(col => {
                    if (col.id === updatedTask.column_id) {
                        return {
                            ...col,
                            tasks: col.tasks.map(task =>
                                task.id === updatedTask.id ? updatedTask : task
                            )
                        };
                    }
                    return col;
                }));

                toast({
                    title: 'Task updated',
                    description: 'Task has been updated successfully',
                });
            } else {
                // Create new task
                const newTask = await KanbanService.createTask({
                    ...taskData,
                    board_id: boardId,
                });

                // Update state
                setColumns(columns.map(col => {
                    if (col.id === newTask.column_id) {
                        return {
                            ...col,
                            tasks: [...col.tasks, newTask]
                        };
                    }
                    return col;
                }));

                toast({
                    title: 'Task added',
                    description: 'New task has been added successfully',
                });
            }

            setIsTaskModalOpen(false);
        } catch (error) {
            console.error('Error saving task:', error);
            toast({
                title: 'Error saving task',
                description: 'Could not save the task',
                variant: 'destructive',
            });
        }
    };

    // Handle deleting a task
    const handleDeleteTask = async (taskId: number) => {
        try {
            await KanbanService.deleteTask(taskId);

            // Update state
            setColumns(columns.map(col => ({
                ...col,
                tasks: col.tasks.filter(task => task.id !== taskId)
            })));

            setIsTaskModalOpen(false);
            toast({
                title: 'Task deleted',
                description: 'Task has been deleted successfully',
            });
        } catch (error) {
            console.error('Error deleting task:', error);
            toast({
                title: 'Error deleting task',
                description: 'Could not delete the task',
                variant: 'destructive',
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-destructive text-lg mb-4">{error}</p>
                <Button onClick={fetchBoard}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Board Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                    <h1 className="text-2xl font-bold">{board?.name}</h1>
                    <p className="text-muted-foreground">{board?.description}</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => setIsAddColumnOpen(true)}
                    className="flex items-center gap-1"
                >
                    <Plus size={16} />
                    Add Column
                </Button>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto p-4">
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex gap-4 h-full min-h-[calc(100vh-250px)]">
                        {columns.map((column) => (
                            <KanbanColumn
                                key={column.id}
                                column={column}
                                onAddTask={() => handleAddTask(column.id)}
                                onEditTask={handleEditTask}
                            />
                        ))}
                    </div>

                    {/* Drag Overlay */}
                    <DragOverlay>
                        {activeTask ? (
                            <TaskComponent
                                task={activeTask}
                                onEdit={() => { }}
                                className="w-[350px] opacity-80"
                            />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Add Column Dialog */}
            <AddColumnDialog
                open={isAddColumnOpen}
                onOpenChange={setIsAddColumnOpen}
                onSubmit={handleAddColumn}
            />

            {/* Task Modal */}
            {currentTask && (
                <TaskModal
                    open={isTaskModalOpen}
                    onOpenChange={setIsTaskModalOpen}
                    task={currentTask}
                    onSave={handleSaveTask}
                    onDelete={handleDeleteTask}
                />
            )}
        </div>
    );
}
