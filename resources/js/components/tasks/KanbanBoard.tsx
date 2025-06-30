import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Clock, Calendar, AlertCircle, CheckCircle2, ArrowRightCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';
import { GlassContainer } from '@/components/ui/glass-container';
import { motion, AnimatePresence } from 'framer-motion';
import { containerVariants, itemVariants } from '@/lib/theme-constants';

// Define status columns for the Kanban board
const statusColumns = [
    { id: 'pending', title: 'To Do', color: 'bg-yellow-500', icon: <Clock className="w-4 h-4" /> },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500', icon: <ArrowRightCircle className="w-4 h-4" /> },
    { id: 'completed', title: 'Completed', color: 'bg-green-500', icon: <CheckCircle2 className="w-4 h-4" /> }
];

const priorityColors = {
    low: 'bg-slate-400 dark:bg-slate-600',
    medium: 'bg-blue-400 dark:bg-blue-600',
    high: 'bg-red-400 dark:bg-red-600'
};

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

interface KanbanBoardProps {
    tasks: Task[];
    onTaskUpdate?: (taskId: number, status: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onTaskUpdate }) => {
    const { toast } = useToast();
    const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
    const [isUpdating, setIsUpdating] = useState<number | null>(null);

    // Group tasks by status
    const groupedTasks = statusColumns.reduce((acc, column) => {
        acc[column.id] = localTasks.filter(task => task.status === column.id);
        return acc;
    }, {} as Record<string, Task[]>);

    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        // If dropped outside a droppable area or in the same position
        if (!destination ||
            (destination.droppableId === source.droppableId &&
                destination.index === source.index)) {
            return;
        }

        const taskId = parseInt(draggableId.replace('task-', ''));
        const newStatus = destination.droppableId;
        const task = localTasks.find(t => t.id === taskId);

        if (!task) return;

        // Optimistically update UI
        setIsUpdating(taskId);
        const updatedTasks = localTasks.map(task =>
            task.id === taskId
                ? { ...task, status: newStatus as 'pending' | 'in_progress' | 'completed' }
                : task
        );
        setLocalTasks(updatedTasks);

        try {
            // Update task status in the backend
            await axios.put(`/api/tasks/${taskId}`, {
                status: newStatus
            });

            // Notify about the status change
            toast({
                title: "Task Updated",
                description: `Task "${task.title}" moved to ${statusColumns.find(col => col.id === newStatus)?.title}`,
            });

            // Call parent callback if provided
            if (onTaskUpdate) {
                onTaskUpdate(taskId, newStatus);
            }
        } catch (error) {
            console.error('Error updating task status:', error);

            // Revert to original state on error
            setLocalTasks(localTasks);

            toast({
                title: "Update Failed",
                description: "Failed to update task status. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsUpdating(null);
        }
    };

    const getNameInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const TaskCard = ({ task }: { task: Task }) => (
        <GlassContainer className="p-0 hover:shadow-lg transition-all duration-300" hoverEffect={true}>
            <CardHeader className="p-3 pb-0">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-base line-clamp-2">
                        {task.title}
                    </CardTitle>
                    <Badge className={`${priorityColors[task.priority]}`}>
                        {task.priority}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-3 pt-2 space-y-2">
                {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                    </p>
                )}

                <div className="flex items-center text-xs text-muted-foreground gap-3">
                    <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(task.end_date)}</span>
                    </div>

                    {task.effort_hours && (
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{task.effort_hours}h</span>
                        </div>
                    )}

                    {task.importance && (
                        <div className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>{task.importance}/5</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center pt-1">
                    {task.assignment?.title && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="text-xs font-medium truncate max-w-[150px] text-neutral-500 dark:text-neutral-400">
                                        {task.assignment.title}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{task.assignment.title}</p>
                                    {task.assignment.group && (
                                        <p className="text-xs opacity-80">{task.assignment.group.name}</p>
                                    )}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    {task.assigned_user ? (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Avatar className="w-6 h-6 border border-white/20 dark:border-gray-800/50">
                                        {task.assigned_user.avatar ? (
                                            <AvatarImage src={task.assigned_user.avatar} alt={task.assigned_user.name} />
                                        ) : (
                                            <AvatarFallback className="bg-gradient-to-br from-primary-100 to-primary-300 dark:from-gray-700 dark:to-gray-900">
                                                {getNameInitials(task.assigned_user.name)}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{task.assigned_user.name}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : (
                        <Badge variant="outline" className="text-xs">Unassigned</Badge>
                    )}
                </div>
            </CardContent>
        </GlassContainer>
    );

    return (
        <motion.div
            className="kanban-board h-full w-full overflow-x-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex gap-4 p-4 min-w-max h-full">
                    {statusColumns.map((column, columnIndex) => (
                        <motion.div
                            key={column.id}
                            className="flex flex-col min-w-[300px] max-w-[350px] w-1/3"
                            variants={itemVariants}
                            custom={columnIndex}
                            transition={{ delay: columnIndex * 0.1 }}
                        >
                            <GlassContainer className="mb-2 overflow-hidden">
                                <div className={`flex items-center gap-2 p-3 rounded-t-lg ${column.color} text-white`}>
                                    {column.icon}
                                    <h3 className="font-semibold">{column.title}</h3>
                                    <Badge variant="outline" className="ml-auto bg-white/20 text-white">
                                        {groupedTasks[column.id]?.length || 0}
                                    </Badge>
                                </div>

                                <Droppable droppableId={column.id}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="flex-1 p-2 min-h-[500px] max-h-[calc(100vh-240px)] overflow-y-auto"
                                        >
                                            <AnimatePresence>
                                                {groupedTasks[column.id]?.length > 0 ? (
                                                    groupedTasks[column.id].map((task, index) => (
                                                        <Draggable
                                                            key={`task-${task.id}`}
                                                            draggableId={`task-${task.id}`}
                                                            index={index}
                                                        >
                                                            {(provided) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className={`mb-3 ${isUpdating === task.id ? 'opacity-70' : ''}`}
                                                                >
                                                                    <motion.div
                                                                        initial={{ opacity: 0, y: 20 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0, y: -20 }}
                                                                        transition={{
                                                                            type: "spring",
                                                                            stiffness: 300,
                                                                            damping: 25,
                                                                            delay: index * 0.05
                                                                        }}
                                                                    >
                                                                        <TaskCard task={task} />
                                                                    </motion.div>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))
                                                ) : (
                                                    <motion.div
                                                        className="flex items-center justify-center h-full"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: 0.3 }}
                                                    >
                                                        <p className="text-gray-500 dark:text-gray-400 text-center">
                                                            No tasks in this column
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </GlassContainer>
                        </motion.div>
                    ))}
                </div>
            </DragDropContext>
        </motion.div>
    );
};

export default KanbanBoard;
