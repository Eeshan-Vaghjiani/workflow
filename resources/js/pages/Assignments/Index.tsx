import React, { useState, useEffect } from 'react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, ChevronDown, ChevronUp, Clock, Search, X } from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import _ from 'lodash';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Assignment {
    id: number;
    title: string;
    description: string | null;
    due_date: string;
    status: string;
    unit_name: string;
    created_at: string;
    tasks: {
        id: number;
        status: string;
        title?: string;
        description?: string | null;
        assigned_user_id?: number | null;
    }[];
    group: {
        id: number;
        name: string;
    };
}

interface Group {
    id: number;
    name: string;
}

interface Props {
    assignments: Assignment[];
    userGroups: Group[];
    filters: {
        search: string;
        group_id: string;
        status: string;
        sort: string;
        direction: string;
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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Assignments',
        href: '/assignments',
    },
];

export default function AssignmentsIndex({ assignments, userGroups, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [groupId, setGroupId] = useState(filters.group_id || 'all');
    const [status, setStatus] = useState(filters.status || 'all');
    const [sort, setSort] = useState(filters.sort || 'due_date');
    const [direction, setDirection] = useState(filters.direction || 'asc');
    const [activeTab, setActiveTab] = useState('uncompleted');

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

        router.get(route('assignments'), processedFilters, {
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
        setGroupId('all');
        setStatus('all');
        setSort('due_date');
        setDirection('asc');
        router.get(route('assignments'), {}, {
            preserveState: true,
            replace: true
        });
    };

    // Get status badge color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
            case 'active':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
            case 'due':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
            case 'archived':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
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

    // Get border color based on task completion and due date
    const getBorderColor = (assignment: Assignment) => {
        const now = new Date();
        const due = parseISO(assignment.due_date);
        const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // First priority: Overdue assignments always get red border
        if (daysUntilDue < 0) {
            return 'border-red-500 dark:border-red-600'; // Overdue assignment
        }

        // Check if all tasks are completed
        const hasCompletableTasks = assignment.tasks.length > 0;
        const allTasksCompleted = hasCompletableTasks &&
            assignment.tasks.every(task => task.status === 'completed');

        if (allTasksCompleted) {
            return 'border-green-500 dark:border-green-600'; // All tasks completed
        } else {
            return 'border-gray-200 dark:border-gray-700'; // Default border
        }
    };

    // Process assignments to mark overdue ones as 'due'
    const processedAssignments = assignments.map(assignment => {
        const now = new Date();
        const due = parseISO(assignment.due_date);
        const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Create a shallow copy of the assignment
        const processedAssignment = { ...assignment };

        // If the assignment is active but past due date, mark as 'due'
        if (processedAssignment.status === 'active' && daysUntilDue < 0) {
            processedAssignment.status = 'due';
        }

        return processedAssignment;
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Assignments" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Assignments</h1>
                    <Link
                        href={route('groups.index')}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 transition"
                    >
                        Create Assignment
                    </Link>
                </div>

                {/* Filters */}
                <Card className="mb-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search assignments..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
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
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="due">Due</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    onClick={resetFilters}
                                    className="w-full"
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Reset Filters
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sort Controls */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <Button
                        variant={sort === 'due_date' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSort('due_date')}
                        className="flex items-center"
                    >
                        Due Date
                        {sort === 'due_date' && (
                            direction === 'asc' ?
                                <ChevronUp className="ml-1 h-4 w-4" /> :
                                <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                    </Button>
                    <Button
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
                    </Button>
                    <Button
                        variant={sort === 'created_at' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSort('created_at')}
                        className="flex items-center"
                    >
                        Created Date
                        {sort === 'created_at' && (
                            direction === 'asc' ?
                                <ChevronUp className="ml-1 h-4 w-4" /> :
                                <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        variant={sort === 'unit_name' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSort('unit_name')}
                        className="flex items-center"
                    >
                        Unit Name
                        {sort === 'unit_name' && (
                            direction === 'asc' ?
                                <ChevronUp className="ml-1 h-4 w-4" /> :
                                <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                    </Button>
                </div>

                {/* Tabs for completed/uncompleted assignments */}
                <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="uncompleted">
                            Uncompleted Assignments
                            <Badge variant="outline" className="ml-2">
                                {processedAssignments.filter(assignment => assignment.status !== 'completed').length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="completed">
                            Completed Assignments
                            <Badge variant="outline" className="ml-2">
                                {processedAssignments.filter(assignment => assignment.status === 'completed').length}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>

                    {/* Uncompleted Assignments Tab */}
                    <TabsContent value="uncompleted">
                        {processedAssignments.filter(assignment => assignment.status !== 'completed').length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {processedAssignments
                                    .filter(assignment => assignment.status !== 'completed')
                                    .map((assignment) => (
                                        <Card
                                            key={assignment.id}
                                            className={`overflow-hidden hover:shadow-md transition-shadow border-2 ${getBorderColor(assignment)}`}
                                        >
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between items-start">
                                                    <Link href={route('group-assignments.show', { group: assignment.group.id, assignment: assignment.id })}>
                                                        <CardTitle className="text-lg text-blue-600 hover:text-blue-800 line-clamp-1">{assignment.title}</CardTitle>
                                                    </Link>
                                                    <Badge className={getStatusColor(assignment.status)}>
                                                        {assignment.status}
                                                    </Badge>
                                                </div>
                                                <CardDescription>
                                                    {assignment.unit_name || 'General'}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="pb-2">
                                                <p className="text-sm text-gray-500 line-clamp-2 mb-2">{assignment.description || 'No description'}</p>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="flex items-center">
                                                        <CalendarIcon className="mr-1 h-4 w-4" />
                                                        <span className={getDueDateColor(assignment.due_date)}>
                                                            {formatDate(assignment.due_date)}
                                                        </span>
                                                    </span>
                                                    <span className="flex items-center">
                                                        <Clock className="mr-1 h-4 w-4" />
                                                        {formatDistanceToNow(parseISO(assignment.due_date), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="pt-2 flex justify-between items-center border-t">
                                                <Link
                                                    href={route('groups.show', assignment.group.id)}
                                                    className="text-sm text-blue-500 hover:text-blue-700"
                                                >
                                                    {assignment.group.name}
                                                </Link>
                                                <Badge variant="outline">
                                                    {assignment.tasks.length} {assignment.tasks.length === 1 ? 'task' : 'tasks'}
                                                </Badge>
                                            </CardFooter>
                                        </Card>
                                    ))}
                            </div>
                        ) : (
                            <div className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[30vh] flex items-center justify-center overflow-hidden rounded-xl border">
                                <div className="text-center">
                                    <h3 className="text-xl font-semibold mb-2">No Uncompleted Assignments</h3>
                                    <p className="text-gray-500 mb-4">
                                        {(search || groupId !== 'all' || status !== 'all')
                                            ? 'Try adjusting your filters to see more assignments.'
                                            : 'All your assignments are completed. Great job!'}
                                    </p>
                                    {(search || groupId !== 'all' || status !== 'all') ? (
                                        <Button onClick={resetFilters} variant="outline">
                                            <X className="mr-2 h-4 w-4" />
                                            Reset Filters
                                        </Button>
                                    ) : (
                                        <Link
                                            href={route('groups.index')}
                                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 transition"
                                        >
                                            Create Assignment
                                        </Link>
                                    )}
                                </div>
                                <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/10 dark:stroke-neutral-100/10" />
                            </div>
                        )}
                    </TabsContent>

                    {/* Completed Assignments Tab */}
                    <TabsContent value="completed">
                        {processedAssignments.filter(assignment => assignment.status === 'completed').length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {processedAssignments
                                    .filter(assignment => assignment.status === 'completed')
                                    .map((assignment) => (
                                        <Card
                                            key={assignment.id}
                                            className={`overflow-hidden hover:shadow-md transition-shadow border-2 ${getBorderColor(assignment)}`}
                                        >
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between items-start">
                                                    <Link href={route('group-assignments.show', { group: assignment.group.id, assignment: assignment.id })}>
                                                        <CardTitle className="text-lg text-blue-600 hover:text-blue-800 line-clamp-1">{assignment.title}</CardTitle>
                                                    </Link>
                                                    <Badge className={getStatusColor(assignment.status)}>
                                                        {assignment.status}
                                                    </Badge>
                                                </div>
                                                <CardDescription>
                                                    {assignment.unit_name || 'General'}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="pb-2">
                                                <p className="text-sm text-gray-500 line-clamp-2 mb-2">{assignment.description || 'No description'}</p>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="flex items-center">
                                                        <CalendarIcon className="mr-1 h-4 w-4" />
                                                        <span>
                                                            {formatDate(assignment.due_date)}
                                                        </span>
                                                    </span>
                                                    <span className="flex items-center">
                                                        <Clock className="mr-1 h-4 w-4" />
                                                        {formatDistanceToNow(parseISO(assignment.due_date), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="pt-2 flex justify-between items-center border-t">
                                                <Link
                                                    href={route('groups.show', assignment.group.id)}
                                                    className="text-sm text-blue-500 hover:text-blue-700"
                                                >
                                                    {assignment.group.name}
                                                </Link>
                                                <Badge variant="outline">
                                                    {assignment.tasks.length} {assignment.tasks.length === 1 ? 'task' : 'tasks'}
                                                </Badge>
                                            </CardFooter>
                                        </Card>
                                    ))}
                            </div>
                        ) : (
                            <div className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[30vh] flex items-center justify-center overflow-hidden rounded-xl border">
                                <div className="text-center">
                                    <h3 className="text-xl font-semibold mb-2">No Completed Assignments</h3>
                                    <p className="text-gray-500 mb-4">
                                        {(search || groupId !== 'all' || status !== 'all')
                                            ? 'Try adjusting your filters to see more assignments.'
                                            : 'You have not completed any assignments yet.'}
                                    </p>
                                    {(search || groupId !== 'all' || status !== 'all') && (
                                        <Button onClick={resetFilters} variant="outline">
                                            <X className="mr-2 h-4 w-4" />
                                            Reset Filters
                                        </Button>
                                    )}
                                </div>
                                <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/10 dark:stroke-neutral-100/10" />
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
