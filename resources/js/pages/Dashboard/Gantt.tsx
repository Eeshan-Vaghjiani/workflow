import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Suspense, lazy, useState, useCallback, useEffect, useRef } from 'react';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Button } from '@/components/ui/button';
import { GlassContainer } from '@/components/ui/glass-container';
import { motion, type Variants } from 'framer-motion';
import { Calendar, Clock, Calendar as CalendarIcon, Plus, Edit, ListTodo, PlusSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type ButtonVariant } from '@/components/ui/button';
import { type VariantProps } from 'class-variance-authority';
import { buttonVariants } from '@/components/ui/button';

// Animation variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            when: "beforeChildren"
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};

// Import ViewMode as a value
import { ViewMode } from 'gantt-task-react';
import type { Task } from 'gantt-task-react';

// Lazy load the Gantt component and its styles
const GanttComponent = lazy(() => Promise.all([
    import('gantt-task-react').then(module => ({ default: module.Gantt })),
    import('gantt-task-react/dist/index.css').then(() => ({}))
]).then(([moduleExport]) => moduleExport));

interface GanttTask {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    type: string;
    hideChildren: boolean;
    displayOrder: number;
    assignedTo: string;
    assignmentTitle?: string;
    groupName: string;
    priority?: string;
    dependencies: string[];
    styles?: {
        backgroundColor?: string;
        backgroundSelectedColor?: string;
        progressColor?: string;
        progressSelectedColor?: string;
    };
    effort_hours?: number;
    importance?: number;
}

interface Assignment {
    id: number;
    title: string;
    group_id: number;
    group_name: string;
}

interface GroupMember {
    id: number;
    name: string;
}

interface Props {
    tasks: GanttTask[];
    assignments: Assignment[];
    groupMembers: GroupMember[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Gantt Chart',
        href: '/dashboard/gantt',
    },
];

const viewModeOptions = [
    { mode: ViewMode.QuarterDay, label: '6 Hours', icon: Clock },
    { mode: ViewMode.Day, label: 'Day', icon: Calendar },
    { mode: ViewMode.Week, label: 'Week', icon: Calendar },
    { mode: ViewMode.Month, label: 'Month', icon: CalendarIcon },
];

// Custom tooltip component
const CustomTooltip = ({ task, fontSize, fontFamily }: { task: Task; fontSize: string; fontFamily: string }) => {
    const ganttTask = task as unknown as GanttTask;
    return (
        <div className="bg-background p-2 rounded-lg shadow-lg border text-sm" style={{ fontSize, fontFamily }}>
            <div className="font-medium text-foreground">{ganttTask.name}</div>
            <div className="text-muted-foreground">
                {new Date(ganttTask.start).toLocaleDateString()} - {new Date(ganttTask.end).toLocaleDateString()}
            </div>
            {ganttTask.progress > 0 && (
                <div className="text-muted-foreground">Progress: {ganttTask.progress}%</div>
            )}
        </div>
    );
};

export default function GanttView({ tasks, assignments = [], groupMembers = [] }: Props) {
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
    const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
    const [columnWidth, setColumnWidth] = useState(300);
    const [error, setError] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Task creation modal state
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [newTaskStartDate, setNewTaskStartDate] = useState<Date | undefined>(new Date());
    const [newTaskEndDate, setNewTaskEndDate] = useState<Date | undefined>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const [newTaskAssignedTo, setNewTaskAssignedTo] = useState<string>('');
    const [newTaskPriority, setNewTaskPriority] = useState('medium');
    const [newTaskEffortHours, setNewTaskEffortHours] = useState('1');
    const [newTaskImportance, setNewTaskImportance] = useState('3');
    const [isCreatingTask, setIsCreatingTask] = useState(false);

    // Task edit modal state
    const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
    const [isEditingTask, setIsEditingTask] = useState(false);

    // Auto-distribute tasks state
    const [isAssigningTasks, setIsAssigningTasks] = useState(false);
    const [assignmentId, setAssignmentId] = useState<string>('');
    const [groupId, setGroupId] = useState<string>('');

    // Calculate column width based on container width and view mode
    const updateColumnWidth = useCallback(() => {
        if (!containerRef.current) return;

        const containerWidth = containerRef.current.offsetWidth;
        const tableWidth = 155; // listCellWidth
        const availableWidth = containerWidth - tableWidth;

        let columns: number;
        switch (viewMode) {
            case ViewMode.QuarterDay:
                columns = 4 * 30; // 4 quarters per day * ~30 days
                break;
            case ViewMode.Day:
                columns = 30; // ~30 days
                break;
            case ViewMode.Week:
                columns = 12; // ~12 weeks
                break;
            case ViewMode.Month:
            default:
                columns = 6; // 6 months
                break;
        }

        const newColumnWidth = Math.max(Math.floor(availableWidth / columns), 30);
        setColumnWidth(newColumnWidth);
    }, [viewMode]);

    // Update column width on mount, window resize, and view mode change
    useEffect(() => {
        updateColumnWidth();
        window.addEventListener('resize', updateColumnWidth);
        return () => window.removeEventListener('resize', updateColumnWidth);
    }, [updateColumnWidth]);

    // Convert tasks from API format to Gantt-task-react format
    const ganttTasks: Task[] = tasks.map(task => ({
        id: task.id,
        name: task.name,
        start: new Date(task.start),
        end: new Date(task.end),
        progress: task.progress,
        type: task.type === 'project' ? 'project' : 'task',
        hideChildren: task.hideChildren,
        displayOrder: task.displayOrder,
        dependencies: task.dependencies,
        project: task.type === 'project' ? undefined : task.dependencies[0],
        styles: {
            backgroundColor: task.type === 'project' ? 'var(--chart-3)' : 'var(--chart-1)',
            backgroundSelectedColor: 'var(--chart-2)',
            progressColor: 'var(--chart-4)',
            progressSelectedColor: 'var(--chart-5)',
        },
    }));

    const handleTaskClick = useCallback((task: Task) => {
        const originalTask = tasks.find(t => t.id === task.id);
        setSelectedTask(prev => prev?.id === originalTask?.id ? null : originalTask || null);
    }, [tasks]);

    // Handle task date change (drag and drop)
    const handleTaskChange = useCallback(async (task: Task) => {
        try {
            // Skip project types (assignments), only update actual tasks
            if (task.type === 'project') return;

            // Extract the task ID (remove the string prefix if present)
            const taskId = task.id.toString().replace('task-', '');

            // Format dates for the API
            const startDate = task.start.toISOString().split('T')[0];
            const endDate = task.end.toISOString().split('T')[0];

            // Send update to the backend
            await axios.put(`/api/tasks/${taskId}`, {
                start_date: startDate,
                end_date: endDate,
                progress: task.progress
            });

            console.log('Task updated:', task.id, startDate, endDate);
        } catch (error) {
            console.error('Error updating task:', error);
            setError('Failed to update task. Please try again.');
        }
    }, []);

    // Handle task progress change
    const handleProgressChange = useCallback(async (task: Task) => {
        try {
            // Skip project types (assignments), only update actual tasks
            if (task.type === 'project') return;

            // Extract the task ID (remove the string prefix if present)
            const taskId = task.id.toString().replace('task-', '');

            // Calculate status based on progress
            let status = 'not_started';
            if (task.progress >= 100) {
                status = 'completed';
            } else if (task.progress > 0) {
                status = 'in_progress';
            }

            // Send update to the backend
            await axios.put(`/api/tasks/${taskId}`, {
                progress: task.progress,
                status: status
            });

            console.log('Task progress updated:', task.id, task.progress, status);
        } catch (error) {
            console.error('Error updating task progress:', error);
            setError('Failed to update task progress. Please try again.');
        }
    }, []);

    // Handle adding a new task
    const handleAddTask = async () => {
        if (!selectedAssignmentId || !newTaskTitle || !newTaskStartDate || !newTaskEndDate) {
            return;
        }

        setIsCreatingTask(true);

        try {
            await axios.post('/api/tasks', {
                title: newTaskTitle,
                description: newTaskDescription,
                start_date: newTaskStartDate.toISOString().split('T')[0],
                end_date: newTaskEndDate.toISOString().split('T')[0],
                assignment_id: selectedAssignmentId,
                assigned_to: newTaskAssignedTo || null,
                priority: newTaskPriority,
                effort_hours: newTaskEffortHours,
                importance: newTaskImportance
            });

            // Close modal and reset form
            setIsAddTaskModalOpen(false);
            resetTaskForm();

            // Refresh the page to show the new task
            router.reload();
        } catch (error) {
            console.error('Error creating task:', error);
            setError('Failed to create task. Please try again.');
        } finally {
            setIsCreatingTask(false);
        }
    };

    // Handle editing an existing task
    const handleEditTask = async () => {
        if (!selectedTask) return;

        setIsEditingTask(true);

        try {
            const taskId = selectedTask.id.toString().replace('task-', '');

            await axios.put(`/api/tasks/${taskId}`, {
                title: newTaskTitle,
                description: newTaskDescription,
                start_date: newTaskStartDate?.toISOString().split('T')[0],
                end_date: newTaskEndDate?.toISOString().split('T')[0],
                assigned_to: newTaskAssignedTo || null,
                priority: newTaskPriority,
                effort_hours: newTaskEffortHours,
                importance: newTaskImportance
            });

            // Close modal and reset form
            setIsEditTaskModalOpen(false);
            setSelectedTask(null);

            // Refresh the page to show the updated task
            router.reload();
        } catch (error) {
            console.error('Error updating task:', error);
            setError('Failed to update task. Please try again.');
        } finally {
            setIsEditingTask(false);
        }
    };

    // Reset the task form
    const resetTaskForm = () => {
        setSelectedAssignmentId('');
        setNewTaskTitle('');
        setNewTaskDescription('');
        setNewTaskStartDate(new Date());
        setNewTaskEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        setNewTaskAssignedTo('');
        setNewTaskPriority('medium');
        setNewTaskEffortHours('1');
        setNewTaskImportance('3');
    };

    // Open edit task modal with task data
    const openEditTaskModal = (task: GanttTask) => {
        setNewTaskTitle(task.name);
        setNewTaskDescription(''); // Add description from task if available
        setNewTaskStartDate(new Date(task.start));
        setNewTaskEndDate(new Date(task.end));
        setNewTaskAssignedTo(task.assignedTo);
        setNewTaskPriority(task.priority || 'medium');
        setNewTaskEffortHours(task.effort_hours?.toString() || '1');
        setNewTaskImportance(task.importance?.toString() || '3');
        setIsEditTaskModalOpen(true);
    };

    // Create a new assignment
    const handleCreateAssignment = () => {
        router.visit('/group-assignments/create');
    };

    // Handle auto-distributing tasks using AI
    const handleAutoDistributeTasks = async () => {
        if (!assignmentId || !groupId) {
            setError('Please select an assignment first');
            return;
        }

        try {
            setIsAssigningTasks(true);
            const response = await axios.post(`/api/groups/${groupId}/assignments/${assignmentId}/auto-distribute`);

            if (response.data.success) {
                // Refresh data to show new assignments
                router.reload();
            } else {
                setError('Failed to distribute tasks: ' + (response.data.error || 'Unknown error'));
            }
        } catch (error: unknown) {
            console.error('Error distributing tasks:', error);

            // Handle API error responses with detailed messages
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                setError(error.response.data.error);
            } else {
                setError('Failed to distribute tasks. Please try again.');
            }
        } finally {
            setIsAssigningTasks(false);
        }
    };

    // Function to select an assignment for task distribution
    const selectAssignmentForDistribution = (assignment: Assignment) => {
        setAssignmentId(assignment.id.toString());
        setGroupId(assignment.group_id.toString());
    };

    const handleTaskDoubleClick = (task: Task) => {
        const ganttTask = task as unknown as GanttTask;
        setSelectedTask(ganttTask);
        setIsEditTaskModalOpen(true);
    };

    const handleDateChange = (date: Date | null, setter: React.Dispatch<React.SetStateAction<Date | undefined>>) => {
        if (date) {
            setter(date);
        }
    };

    if (error) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Gantt Chart" />
                <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="text-center text-red-500">
                            <h2 className="text-xl font-bold">Error Loading Gantt Chart</h2>
                            <p>{error}</p>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gantt Chart" />
            <motion.div
                className="flex h-full flex-1 flex-col gap-6 p-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    className="grid grid-cols-1 gap-6"
                    variants={containerVariants}
                >
                    {/* Main Gantt Chart */}
                    <motion.div
                        className="col-span-1"
                        variants={itemVariants}
                    >
                        <Card className="bg-background">
                            <div className="flex flex-row items-center justify-between p-6">
                                <div>
                                    <h2 className="text-2xl font-semibold text-foreground">Gantt Chart</h2>
                                    <p className="text-sm text-muted-foreground">View and manage your project timeline</p>
                                </div>
                                <div className="flex space-x-2">
                                    {viewModeOptions.map(({ mode, label, icon: Icon }) => (
                                        <EnhancedButton
                                            key={mode}
                                            onClick={() => setViewMode(mode)}
                                            variant={viewMode === mode ? "primary" : "outline"}
                                            size="sm"
                                            icon={<Icon className="h-4 w-4" />}
                                            iconPosition="left"
                                            magnetic={true}
                                        >
                                            {label}
                                        </EnhancedButton>
                                    ))}
                                    <EnhancedButton
                                        onClick={() => setIsAddTaskModalOpen(true)}
                                        variant="primary"
                                        size="sm"
                                        icon={<Plus className="h-4 w-4" />}
                                        iconPosition="left"
                                        magnetic={true}
                                    >
                                        Add Task
                                    </EnhancedButton>
                                </div>
                            </div>
                            <div className="p-0">
                                <div ref={containerRef} className="gantt-container dark:bg-background dark:text-foreground">
                                    <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
                                        <GanttComponent
                                            tasks={ganttTasks}
                                            viewMode={viewMode}
                                            onDateChange={handleTaskChange}
                                            onTaskClick={handleTaskClick}
                                            onDoubleClick={handleTaskDoubleClick}
                                            listCellWidth={155}
                                            columnWidth={columnWidth.toString()}
                                            ganttHeight={500}
                                            headerHeight={50}
                                            rowHeight={50}
                                            barCornerRadius={4}
                                            barProgressColor="var(--chart-4)"
                                            barProgressSelectedColor="var(--chart-5)"
                                            barBackgroundColor="var(--chart-1)"
                                            barBackgroundSelectedColor="var(--chart-2)"
                                            projectProgressColor="var(--chart-4)"
                                            projectProgressSelectedColor="var(--chart-5)"
                                            projectBackgroundColor="var(--chart-3)"
                                            projectBackgroundSelectedColor="var(--chart-2)"
                                            milestoneBackgroundColor="var(--chart-6)"
                                            milestoneBackgroundSelectedColor="var(--chart-7)"
                                            rtl={false}
                                            TooltipContent={CustomTooltip}
                                        />
                                    </Suspense>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </motion.div>

                {/* Add Task Modal */}
                <Dialog open={isAddTaskModalOpen} onOpenChange={setIsAddTaskModalOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add New Task</DialogTitle>
                            <DialogDescription>
                                Create a new task for your project
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="assignment" className="text-right">
                                    Assignment
                                </Label>
                                <Select
                                    value={selectedAssignmentId}
                                    onValueChange={setSelectedAssignmentId}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select an assignment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {assignments.map((assignment) => (
                                            <SelectItem key={assignment.id} value={assignment.id.toString()}>
                                                {assignment.title} ({assignment.group_name})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="title" className="text-right">
                                    Title
                                </Label>
                                <Input
                                    id="title"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    value={newTaskDescription}
                                    onChange={(e) => setNewTaskDescription(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="startDate" className="text-right">
                                    Start Date
                                </Label>
                                <div className="col-span-3">
                                    <DatePicker
                                        selected={newTaskStartDate}
                                        onSelect={(date) => handleDateChange(date, setNewTaskStartDate)}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="endDate" className="text-right">
                                    Due Date
                                </Label>
                                <div className="col-span-3">
                                    <DatePicker
                                        selected={newTaskEndDate}
                                        onSelect={(date) => handleDateChange(date, setNewTaskEndDate)}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="assignedTo" className="text-right">
                                    Assign To
                                </Label>
                                <Select
                                    value={newTaskAssignedTo}
                                    onValueChange={setNewTaskAssignedTo}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select a member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {groupMembers.map((member) => (
                                            <SelectItem key={member.id} value={member.id.toString()}>
                                                {member.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="priority" className="text-right">
                                    Priority
                                </Label>
                                <Select
                                    value={newTaskPriority}
                                    onValueChange={setNewTaskPriority}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="effort_hours" className="text-right">
                                    Effort (hours)
                                </Label>
                                <Input
                                    id="effort_hours"
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={newTaskEffortHours}
                                    onChange={(e) => setNewTaskEffortHours(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="importance" className="text-right">
                                    Importance
                                </Label>
                                <Select
                                    value={newTaskImportance}
                                    onValueChange={setNewTaskImportance}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select importance" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 (Lowest)</SelectItem>
                                        <SelectItem value="2">2</SelectItem>
                                        <SelectItem value="3">3 (Medium)</SelectItem>
                                        <SelectItem value="4">4</SelectItem>
                                        <SelectItem value="5">5 (Highest)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddTaskModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" onClick={handleAddTask} disabled={isCreatingTask}>
                                {isCreatingTask ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-t-2 border-current"></div>
                                        Creating...
                                    </>
                                ) : (
                                    'Create Task'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Task Modal */}
                <Dialog open={isEditTaskModalOpen} onOpenChange={setIsEditTaskModalOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Edit Task</DialogTitle>
                            <DialogDescription>
                                Update the selected task
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-title" className="text-right">
                                    Title
                                </Label>
                                <Input
                                    id="edit-title"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-description" className="text-right">
                                    Description
                                </Label>
                                <Textarea
                                    id="edit-description"
                                    value={newTaskDescription}
                                    onChange={(e) => setNewTaskDescription(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-startDate" className="text-right">
                                    Start Date
                                </Label>
                                <div className="col-span-3">
                                    <DatePicker
                                        selected={newTaskStartDate}
                                        onSelect={(date) => handleDateChange(date, setNewTaskStartDate)}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-endDate" className="text-right">
                                    Due Date
                                </Label>
                                <div className="col-span-3">
                                    <DatePicker
                                        selected={newTaskEndDate}
                                        onSelect={(date) => handleDateChange(date, setNewTaskEndDate)}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-assignedTo" className="text-right">
                                    Assign To
                                </Label>
                                <Select
                                    value={newTaskAssignedTo}
                                    onValueChange={setNewTaskAssignedTo}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select a member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {groupMembers.map((member) => (
                                            <SelectItem key={member.id} value={member.id.toString()}>
                                                {member.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-priority" className="text-right">
                                    Priority
                                </Label>
                                <Select
                                    value={newTaskPriority}
                                    onValueChange={setNewTaskPriority}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-effort_hours" className="text-right">
                                    Effort (hours)
                                </Label>
                                <Input
                                    id="edit-effort_hours"
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={newTaskEffortHours}
                                    onChange={(e) => setNewTaskEffortHours(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-importance" className="text-right">
                                    Importance
                                </Label>
                                <Select
                                    value={newTaskImportance}
                                    onValueChange={setNewTaskImportance}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select importance" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 (Lowest)</SelectItem>
                                        <SelectItem value="2">2</SelectItem>
                                        <SelectItem value="3">3 (Medium)</SelectItem>
                                        <SelectItem value="4">4</SelectItem>
                                        <SelectItem value="5">5 (Highest)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditTaskModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" onClick={handleEditTask} disabled={isEditingTask}>
                                {isEditingTask ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-t-2 border-current"></div>
                                        Updating...
                                    </>
                                ) : (
                                    'Update Task'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </motion.div>
        </AppLayout>
    );
}
