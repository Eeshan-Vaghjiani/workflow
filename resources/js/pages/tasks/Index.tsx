import React, { useState, useEffect } from 'react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Card3D } from '@/components/ui/card-3d';
import { GlassContainer } from '@/components/ui/glass-container';
import { CalendarIcon, ChevronDown, ChevronUp, Clock, Search, X } from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import _ from 'lodash';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';
import { toast } from '@/components/ui/use-toast';
import { getCsrfToken } from '../../Utils/csrf.js';
import { motion, AnimatePresence } from 'framer-motion';

interface Task {
    id: number;
    title: string;
    description: string | null;
    end_date: string;
    start_date: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    effort_hours: number;
    importance: number;
    assignment: {
        id: number;
        title: string;
        group: {
            id: number;
            name: string;
        };
    };
    assigned_user?: {
        id: number;
        name: string;
    };
}

interface Assignment {
    id: number;
    title: string;
}

interface Group {
    id: number;
    name: string;
}

interface Props {
    tasks: Task[];
    assignments: Assignment[];
    userGroups: Group[];
    filters: {
        search: string;
        assignment_id: string;
        group_id: string;
        status: string;
        priority: string;
        sort: string;
        direction: string;
        view_all: string;
    };
}

// Helper function to format dates in DD/MM/YYYY format
const formatDate = (dateString: string): string => {
    try {
        return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch {
        return dateString;
    }
};

// Helper function to format time distance in a more readable way
const formatTimeDistance = (dateString: string): string => {
    try {
        const date = parseISO(dateString);
        const now = new Date();
        const diffInMs = Math.abs(date.getTime() - now.getTime());

        // If less than 1 minute, show milliseconds or seconds
        if (diffInMs < 60000) {
            if (diffInMs < 1000) {
                return `${diffInMs}ms`;
            } else {
                return `${Math.floor(diffInMs / 1000)}s`;
            }
        }
        // If less than 1 hour, show minutes
        else if (diffInMs < 3600000) {
            return `${Math.floor(diffInMs / 60000)}m`;
        }
        // If less than 1 day, show hours
        else if (diffInMs < 86400000) {
            return `${Math.floor(diffInMs / 3600000)}h`;
        }
        // Otherwise use the formatDistanceToNow function
        return formatDistanceToNow(date, { addSuffix: true });
    } catch {
        return 'Invalid date';
    }
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'My Tasks',
        href: '/group-tasks',
    },
];

// Define animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            when: "beforeChildren"
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};

export default function Index({ tasks: tasksProp, assignments, userGroups, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [assignmentId, setAssignmentId] = useState(filters.assignment_id || 'all');
    const [groupId, setGroupId] = useState(filters.group_id || 'all');
    const [status, setStatus] = useState(filters.status || 'all');
    const [priority, setPriority] = useState(filters.priority || 'all');
    const [sort, setSort] = useState(filters.sort || 'end_date');
    const [direction, setDirection] = useState(filters.direction || 'asc');
    const [viewAll, setViewAll] = useState(filters.view_all === 'true');
    const [activeTab, setActiveTab] = useState('uncompleted');

    // Ensure tasks is always an array
    const tasks = Array.isArray(tasksProp) ? tasksProp : [];

    // Function to complete a task
    const completeTask = async (taskId: number) => {
        try {
            // Get the CSRF token using our utility function
            const token = getCsrfToken();

            // Make the POST request with proper headers
            await axios.post(`/tasks/${taskId}/complete`, {}, {
                headers: {
                    'X-CSRF-TOKEN': token,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            // Show success message
            toast({
                title: "Task completed",
                description: "The task has been marked as complete.",
            });

            // Refresh the page to show updated data
            window.location.reload();
        } catch (error) {
            console.error('Error completing task:', error);
            toast({
                title: "Error",
                description: "Failed to complete the task. Please try again.",
                variant: "destructive"
            });
        }
    };

    // Debounced search function
    const debouncedSearch = _.debounce((value: string) => {
        updateFilters({ search: value });
    }, 300);

    useEffect(() => {
        debouncedSearch(search);
        return () => {
            debouncedSearch.cancel();
        };
    }, [search]);

    // Update URL with filters
    const updateFilters = (newFilters: Partial<Props['filters']>) => {
        const updatedFilters = {
            ...filters,
            ...newFilters
        };

        // Remove empty filters and convert 'all' to empty string for the backend
        const processedFilters: Record<string, string> = {};
        Object.keys(updatedFilters).forEach((key: string) => {
            const value = updatedFilters[key as keyof Props['filters']];
            if (value && value !== 'all') {
                processedFilters[key] = value;
            }
        });

        router.get(route('group-tasks.index'), processedFilters, {
            preserveState: true,
            replace: true
        });
    };

    // Handle sort change
    const handleSort = (newSort: string) => {
        let newDirection = 'asc';
        if (newSort === sort) {
            newDirection = direction === 'asc' ? 'desc' : 'asc';
        }
        setSort(newSort);
        setDirection(newDirection);
        updateFilters({ sort: newSort, direction: newDirection });
    };

    // Reset all filters
    const resetFilters = () => {
        setSearch('');
        setAssignmentId('all');
        setGroupId('all');
        setStatus('all');
        setPriority('all');
        setSort('end_date');
        setDirection('asc');
        setViewAll(false);
        router.get(route('group-tasks.index'), {}, {
            preserveState: true,
            replace: true
        });
    };

    // Toggle between viewing all tasks and just assigned tasks
    const toggleViewAll = () => {
        const newViewAll = !viewAll;
        setViewAll(newViewAll);
        updateFilters({ view_all: newViewAll ? 'true' : 'false' });
    };

    // Get status badge color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
        }
    };

    // Get priority badge color
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
            case 'medium':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
            case 'low':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
        }
    };

    // Get due date color based on proximity
    const getDueDateColor = (dueDate: string) => {
        const now = new Date();
        const due = parseISO(dueDate);
        const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilDue < 0) {
            return 'text-red-600 dark:text-red-400 font-semibold'; // Overdue
        } else if (daysUntilDue === 0) {
            return 'text-orange-600 dark:text-orange-400 font-semibold'; // Due today
        } else if (daysUntilDue <= 2) {
            return 'text-amber-600 dark:text-amber-400'; // Due very soon (1-2 days)
        } else if (daysUntilDue <= 5) {
            return 'text-yellow-600 dark:text-yellow-400'; // Due soon (3-5 days)
        } else if (daysUntilDue <= 14) {
            return 'text-lime-600 dark:text-lime-400'; // Due in a couple weeks
        } else {
            return 'text-green-600 dark:text-green-400'; // Due later
        }
    };

    // Get border color based on task status and due date
    const getBorderColor = (task: Task) => {
        const now = new Date();
        const due = parseISO(task.end_date);
        const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // First priority: Overdue tasks always get red border
        if (daysUntilDue < 0) {
            return 'border-red-500 dark:border-red-600'; // Overdue task
        }

        if (task.status === 'completed') {
            return 'border-green-500 dark:border-green-600'; // Completed task
        } else if (task.priority === 'high') {
            return 'border-orange-500 dark:border-orange-600'; // High priority task
        } else {
            return 'border-gray-200 dark:border-gray-700'; // Default border
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={viewAll ? 'All Tasks' : 'My Tasks'} />
            <motion.div
                className="flex h-full flex-1 flex-col gap-4 p-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    className="flex justify-between items-center mb-4"
                    variants={itemVariants}
                >
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-neon-green bg-clip-text text-transparent">
                        {viewAll ? 'All Tasks' : 'My Tasks'}
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="view-all-tasks"
                                checked={viewAll}
                                onCheckedChange={toggleViewAll}
                            />
                            <Label htmlFor="view-all-tasks" className="text-sm">
                                {viewAll ? 'Viewing all tasks' : 'Viewing my tasks'}
                            </Label>
                        </div>
                        <Link
                            href={route('group-tasks.create')}
                        >
                            <EnhancedButton variant="glow">
                                Create Task
                            </EnhancedButton>
                        </Link>
                    </div>
                </motion.div>

                {/* Filters */}
                <motion.div variants={itemVariants}>
                    <GlassContainer className="mb-4" blurIntensity="md" border={true}>
                        <div className="p-4">
                            <h2 className="text-lg font-semibold mb-3">Filters</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Search</label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search tasks..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Assignment</label>
                                    <Select
                                        value={assignmentId}
                                        onValueChange={(value) => {
                                            setAssignmentId(value);
                                            updateFilters({ assignment_id: value });
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Assignments" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Assignments</SelectItem>
                                            {assignments.map((assignment) => (
                                                <SelectItem key={assignment.id} value={assignment.id.toString()}>
                                                    {assignment.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Group</label>
                                    <Select
                                        value={groupId}
                                        onValueChange={(value) => {
                                            setGroupId(value);
                                            updateFilters({ group_id: value });
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Groups" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Groups</SelectItem>
                                            {userGroups.map((group) => (
                                                <SelectItem key={group.id} value={group.id.toString()}>
                                                    {group.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Status</label>
                                    <Select
                                        value={status}
                                        onValueChange={(value) => {
                                            setStatus(value);
                                            updateFilters({ status: value });
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Priority</label>
                                    <Select
                                        value={priority}
                                        onValueChange={(value) => {
                                            setPriority(value);
                                            updateFilters({ priority: value });
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Priorities" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Priorities</SelectItem>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="md:col-span-3 lg:col-span-5 flex justify-end">
                                    <EnhancedButton
                                        variant="outline"
                                        onClick={resetFilters}
                                        className="w-full md:w-auto"
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Reset Filters
                                    </EnhancedButton>
                                </div>
                            </div>
                        </div>
                    </GlassContainer>
                </motion.div>

                {/* Sort Controls */}
                <motion.div
                    className="flex flex-wrap gap-2 mb-4"
                    variants={itemVariants}
                >
                    <EnhancedButton
                        variant={sort === 'end_date' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSort('end_date')}
                        className="flex items-center"
                    >
                        Due Date
                        {sort === 'end_date' && (
                            direction === 'asc' ?
                                <ChevronUp className="ml-1 h-4 w-4" /> :
                                <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                    </EnhancedButton>
                    <EnhancedButton
                        variant={sort === 'title' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSort('title')}
                        className="flex items-center"
                    >
                        Title
                        {sort === 'title' && (
                            direction === 'asc' ?
                                <ChevronUp className="ml-1 h-4 w-4" /> :
                                <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                    </EnhancedButton>
                    <EnhancedButton
                        variant={sort === 'priority' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSort('priority')}
                        className="flex items-center"
                    >
                        Priority
                        {sort === 'priority' && (
                            direction === 'asc' ?
                                <ChevronUp className="ml-1 h-4 w-4" /> :
                                <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                    </EnhancedButton>
                    <EnhancedButton
                        variant={sort === 'status' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSort('status')}
                        className="flex items-center"
                    >
                        Status
                        {sort === 'status' && (
                            direction === 'asc' ?
                                <ChevronUp className="ml-1 h-4 w-4" /> :
                                <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                    </EnhancedButton>
                    <EnhancedButton
                        variant={sort === 'effort_hours' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSort('effort_hours')}
                        className="flex items-center"
                    >
                        Effort Hours
                        {sort === 'effort_hours' && (
                            direction === 'asc' ?
                                <ChevronUp className="ml-1 h-4 w-4" /> :
                                <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                    </EnhancedButton>
                </motion.div>

                {/* Tabs for completed/uncompleted tasks */}
                <motion.div variants={itemVariants}>
                    <GlassContainer className="p-4" blurIntensity="sm" border={true}>
                        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="uncompleted">
                                    Uncompleted Tasks
                                    <Badge variant="outline" className="ml-2">
                                        {tasks.filter(task => task.status !== 'completed').length}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="completed">
                                    Completed Tasks
                                    <Badge variant="outline" className="ml-2">
                                        {tasks.filter(task => task.status === 'completed').length}
                                    </Badge>
                                </TabsTrigger>
                            </TabsList>

                            {/* Uncompleted Tasks Tab */}
                            <TabsContent value="uncompleted">
                                <AnimatePresence>
                                    {tasks.filter(task => task.status !== 'completed').length > 0 ? (
                                        <motion.div
                                            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                        >
                                            {tasks
                                                .filter(task => task.status !== 'completed')
                                                .map((task) => (
                                                    <motion.div key={task.id} variants={itemVariants}>
                                                        <Card3D intensity={10} className="h-full">
                                                            <CardHeader className="pb-2">
                                                                <div className="flex justify-between items-start">
                                                                    {task.assignment && task.assignment.group ? (
                                                                        <Link href={route('group-tasks.show', {
                                                                            group: task.assignment.group.id,
                                                                            assignment: task.assignment.id,
                                                                            task: task.id
                                                                        })}>
                                                                            <CardTitle className="text-lg text-primary-600 hover:text-primary-500 dark:text-neon-green dark:hover:text-primary-400 line-clamp-1">{task.title}</CardTitle>
                                                                        </Link>
                                                                    ) : (
                                                                        <CardTitle className="text-lg line-clamp-1">{task.title}</CardTitle>
                                                                    )}
                                                                    <div className="flex gap-2">
                                                                        <Badge className={getPriorityColor(task.priority)}>
                                                                            {task.priority}
                                                                        </Badge>
                                                                        <Badge className={getStatusColor(task.status)}>
                                                                            {task.status.replace('_', ' ')}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                                {task.assignment && (
                                                                    <CardDescription>
                                                                        {task.assignment.title}
                                                                    </CardDescription>
                                                                )}
                                                            </CardHeader>
                                                            <CardContent className="pb-2">
                                                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{task.description || 'No description'}</p>
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <span className="flex items-center">
                                                                        <CalendarIcon className="mr-1 h-4 w-4" />
                                                                        <span className={getDueDateColor(task.end_date)}>
                                                                            {formatDate(task.end_date)}
                                                                        </span>
                                                                    </span>
                                                                    <span className="flex items-center">
                                                                        <Clock className="mr-1 h-4 w-4" />
                                                                        {formatTimeDistance(task.end_date)}
                                                                    </span>
                                                                </div>
                                                            </CardContent>
                                                            <CardFooter className="pt-2 flex justify-between items-center border-t">
                                                                <div className="flex items-center">
                                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                        {task.effort_hours} {task.effort_hours === 1 ? 'hour' : 'hours'}
                                                                    </span>
                                                                </div>
                                                                {task.assigned_user && (
                                                                    <Badge variant="outline">
                                                                        {task.assigned_user.name}
                                                                    </Badge>
                                                                )}
                                                            </CardFooter>
                                                            <div className="px-4 pb-4">
                                                                <EnhancedButton
                                                                    onClick={() => completeTask(task.id)}
                                                                    variant="glow"
                                                                    className="w-full"
                                                                >
                                                                    Mark as Complete
                                                                </EnhancedButton>
                                                            </div>
                                                        </Card3D>
                                                    </motion.div>
                                                ))}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[30vh] flex items-center justify-center overflow-hidden rounded-xl border"
                                            variants={itemVariants}
                                        >
                                            <div className="text-center">
                                                <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-neon-green bg-clip-text text-transparent">No Uncompleted Tasks</h3>
                                                <p className="text-gray-500 dark:text-gray-400 mb-4">
                                                    {(search || assignmentId !== 'all' || groupId !== 'all' || status !== 'all' || priority !== 'all')
                                                        ? 'Try adjusting your filters to see more tasks.'
                                                        : 'All your tasks are completed. Great job!'}
                                                </p>
                                                {(search || assignmentId !== 'all' || groupId !== 'all' || status !== 'all' || priority !== 'all') ? (
                                                    <EnhancedButton onClick={resetFilters} variant="outline">
                                                        <X className="mr-2 h-4 w-4" />
                                                        Reset Filters
                                                    </EnhancedButton>
                                                ) : (
                                                    <Link
                                                        href={route('group-tasks.create')}
                                                    >
                                                        <EnhancedButton variant="glow">
                                                            Create Task
                                                        </EnhancedButton>
                                                    </Link>
                                                )}
                                            </div>
                                            <PlaceholderPattern className="absolute inset-0 size-full stroke-primary-600/10 dark:stroke-neon-green/10" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </TabsContent>

                            {/* Completed Tasks Tab */}
                            <TabsContent value="completed">
                                <AnimatePresence>
                                    {tasks.filter(task => task.status === 'completed').length > 0 ? (
                                        <motion.div
                                            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                        >
                                            {tasks
                                                .filter(task => task.status === 'completed')
                                                .map((task) => (
                                                    <motion.div key={task.id} variants={itemVariants}>
                                                        <Card3D intensity={5} className="h-full">
                                                            <CardHeader className="pb-2">
                                                                <div className="flex justify-between items-start">
                                                                    {task.assignment && task.assignment.group ? (
                                                                        <Link href={route('group-tasks.show', {
                                                                            group: task.assignment.group.id,
                                                                            assignment: task.assignment.id,
                                                                            task: task.id
                                                                        })}>
                                                                            <CardTitle className="text-lg text-primary-600 hover:text-primary-500 dark:text-neon-green dark:hover:text-primary-400 line-clamp-1">{task.title}</CardTitle>
                                                                        </Link>
                                                                    ) : (
                                                                        <CardTitle className="text-lg line-clamp-1">{task.title}</CardTitle>
                                                                    )}
                                                                    <Badge className={getStatusColor(task.status)}>
                                                                        {task.status.replace('_', ' ')}
                                                                    </Badge>
                                                                </div>
                                                                {task.assignment && (
                                                                    <CardDescription>
                                                                        {task.assignment.title}
                                                                    </CardDescription>
                                                                )}
                                                            </CardHeader>
                                                            <CardContent className="pb-2">
                                                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{task.description || 'No description'}</p>
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <span className="flex items-center">
                                                                        <CalendarIcon className="mr-1 h-4 w-4" />
                                                                        <span>
                                                                            {formatDate(task.end_date)}
                                                                        </span>
                                                                    </span>
                                                                    <span className="flex items-center">
                                                                        <Clock className="mr-1 h-4 w-4" />
                                                                        {formatTimeDistance(task.end_date)}
                                                                    </span>
                                                                </div>
                                                            </CardContent>
                                                            <CardFooter className="pt-2 flex justify-between items-center border-t">
                                                                <div className="flex items-center">
                                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                        {task.effort_hours} {task.effort_hours === 1 ? 'hour' : 'hours'}
                                                                    </span>
                                                                </div>
                                                                {task.assigned_user && (
                                                                    <Badge variant="outline">
                                                                        {task.assigned_user.name}
                                                                    </Badge>
                                                                )}
                                                            </CardFooter>
                                                        </Card3D>
                                                    </motion.div>
                                                ))}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[30vh] flex items-center justify-center overflow-hidden rounded-xl border"
                                            variants={itemVariants}
                                        >
                                            <div className="text-center">
                                                <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-neon-green bg-clip-text text-transparent">No Completed Tasks</h3>
                                                <p className="text-gray-500 dark:text-gray-400 mb-4">
                                                    {(search || assignmentId !== 'all' || groupId !== 'all' || status !== 'all' || priority !== 'all')
                                                        ? 'Try adjusting your filters to see more tasks.'
                                                        : 'You have not completed any tasks yet.'}
                                                </p>
                                                {(search || assignmentId !== 'all' || groupId !== 'all' || status !== 'all' || priority !== 'all') && (
                                                    <EnhancedButton onClick={resetFilters} variant="outline">
                                                        <X className="mr-2 h-4 w-4" />
                                                        Reset Filters
                                                    </EnhancedButton>
                                                )}
                                            </div>
                                            <PlaceholderPattern className="absolute inset-0 size-full stroke-primary-600/10 dark:stroke-neon-green/10" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </TabsContent>
                        </Tabs>
                    </GlassContainer>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}
