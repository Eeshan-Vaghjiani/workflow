import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Card3D } from '@/components/ui/card-3d';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BrainCircuit, Loader2, Sparkles, CalendarRange, Clock, AlertCircle, RefreshCw, Users } from 'lucide-react';
import { AxiosError } from 'axios';
import { useToast } from '@/components/ui/use-toast';
import { type BreadcrumbItem } from '@/types';
import { format, parseISO } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { getCsrfToken, refreshCsrfToken, csrfRequest } from '../../Utils/csrf.js';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from '@/lib/theme-constants';

// Helper function to format dates in DD/MM/YYYY format
const formatDate = (dateString: string): string => {
    try {
        return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch {
        return dateString;
    }
};

interface GroupMember {
    id: number;
    name: string;
    email: string;
}

interface Task {
    id?: number;
    title: string;
    description: string;
    assigned_to_name?: string;
    assigned_user_id?: number;
    start_date: string;
    end_date: string;
    priority: 'low' | 'medium' | 'high';
    effort_hours: number;
    importance: number;
}

interface Assignment {
    id?: number;
    title: string;
    unit_name: string;
    description: string;
    due_date: string;
}

interface AIResponse {
    assignment: Assignment;
    tasks: Task[];
    workloadStats?: WorkloadStats;
}

interface WorkloadMember {
    id: number;
    name: string;
    taskCount: number;
    totalEffort: number;
    totalImportance: number;
    weightedWorkload: number;
    percentage: number;
    tasks: Task[];
}

interface WorkloadStats {
    distribution: WorkloadMember[];
    hasUnassignedTasks: boolean;
}

interface AITaskAssignmentProps {
    group: {
        id: number;
        name: string;
        members: GroupMember[];
    };
    assignment?: {
        id: number;
        title: string;
    };
    workloadStats?: WorkloadStats;
}

interface ErrorResponse {
    error?: string;
    auth_status?: boolean;
    redirect?: string;
}

export default function AITaskAssignment({ group, assignment, workloadStats }: AITaskAssignmentProps) {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AIResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isReassigning, setIsReassigning] = useState(false);
    const [workloadStatsState, setWorkloadStats] = useState<WorkloadStats | null>(workloadStats || null);
    const { toast } = useToast();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Groups',
            href: '/groups',
        },
        {
            title: group.name,
            href: `/groups/${group.id}`,
        },
        {
            title: 'AI Task Assignment',
            href: `/groups/${group.id}/ai-tasks`,
        },
    ];

    if (assignment) {
        breadcrumbs.splice(2, 0, {
            title: 'Assignments',
            href: `/groups/${group.id}/assignments`,
        });
        breadcrumbs.splice(3, 0, {
            title: assignment.title,
            href: `/groups/${group.id}/assignments/${assignment.id}`,
        });
    }

    // Ensure CSRF token is refreshed on component mount
    useEffect(() => {
        refreshCsrfToken();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!prompt.trim()) {
            setError('Please enter a description of the assignment tasks');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Use the csrfRequest utility function instead of direct axios call
            const response = await csrfRequest('post', `/groups/${group.id}/ai-tasks/generate`, {
                prompt,
                assignment_id: assignment?.id,
                _token: getCsrfToken() // Include CSRF token in the request body as well
            }, {
                withCredentials: true
            }) as AIResponse & ErrorResponse;

            if (response.error) {
                setError(response.error);

                // Check if authentication issue
                if (response.auth_status === false) {
                    toast({
                        title: 'Authentication Error',
                        description: 'Please log in again to continue.',
                        variant: 'destructive',
                    });

                    // Redirect to login after a brief delay
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                    return;
                }
            } else {
                setResult(response as AIResponse);

                // Check if workload stats are included in the response
                if (response.workloadStats) {
                    setWorkloadStats(response.workloadStats);
                }

                toast({
                    title: 'Success!',
                    description: 'AI has generated tasks based on your description',
                });
            }
        } catch (err: unknown) {
            console.error('API Error:', err);
            const error = err as AxiosError<ErrorResponse>;
            const errorMessage = error.response?.data?.error || 'An error occurred while generating tasks';
            setError(errorMessage);

            // Check for specific authentication errors
            if (error.response?.status === 401) {
                toast({
                    title: 'Authentication Error',
                    description: 'Your session has expired. Please log in again.',
                    variant: 'destructive',
                });

                // Redirect to login after a brief delay
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
                return;
            } else {
                toast({
                    title: 'Error',
                    description: 'Failed to generate tasks. Please try again.',
                    variant: 'destructive',
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;

        setIsLoading(true);

        try {
            // Use the csrfRequest utility function
            const url = assignment
                ? `/groups/${group.id}/assignments/${assignment.id}/tasks/ai-create`
                : `/groups/${group.id}/assignments/ai-create`;

            // Include the original prompt in the data and CSRF token
            const dataToSend = {
                ...result,
                prompt: prompt,
                _token: getCsrfToken()
            };

            const response = await csrfRequest('post', url, dataToSend, {
                withCredentials: true
            }) as { redirect_url?: string };

            toast({
                title: 'Success!',
                description: 'Assignment and tasks have been saved',
            });

            // Redirect to the assignment page
            if (response.redirect_url) {
                window.location.href = response.redirect_url;
            }
        } catch (err: unknown) {
            console.error('Save Error:', err);
            const error = err as AxiosError<ErrorResponse>;
            const errorMessage = error.response?.data?.error || 'An error occurred while saving the assignment';
            setError(errorMessage);

            // Check for specific authentication errors
            if (error.response?.status === 401) {
                toast({
                    title: 'Authentication Error',
                    description: 'Your session has expired. Please log in again.',
                    variant: 'destructive',
                });

                // Redirect to login after a brief delay
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                toast({
                    title: 'Error',
                    description: 'Failed to save the assignment. Please try again.',
                    variant: 'destructive',
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAutoDistribute = async () => {
        if (!result?.tasks) return;

        setIsReassigning(true);

        try {
            // Use the csrfRequest utility function
            const response = await csrfRequest('post', `/groups/${group.id}/ai-tasks/distribute`, {
                tasks: result.tasks,
                members: group.members,
                _token: getCsrfToken()
            }, {
                withCredentials: true
            }) as { tasks: Task[], workloadStats?: WorkloadStats };

            if (response.tasks) {
                setResult({
                    ...result,
                    tasks: response.tasks
                });

                // Update workload stats if included in the response
                if (response.workloadStats) {
                    setWorkloadStats(response.workloadStats);
                }

                toast({
                    title: 'Success!',
                    description: 'Tasks have been automatically distributed among team members',
                });
            }
        } catch (err: unknown) {
            console.error('Distribution Error:', err);
            const error = err as AxiosError<ErrorResponse>;

            // Check for specific authentication errors
            if (error.response?.status === 401) {
                toast({
                    title: 'Authentication Error',
                    description: 'Your session has expired. Please log in again.',
                    variant: 'destructive',
                });

                // Redirect to login after a brief delay
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                toast({
                    title: 'Error',
                    description: 'Failed to redistribute tasks. Please try again.',
                    variant: 'destructive',
                });
            }
        } finally {
            setIsReassigning(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
            case 'medium':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
            case 'low':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
            default:
                return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Task Assignment" />
            <motion.div
                className="space-y-6 p-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    className="flex justify-between items-center"
                    variants={itemVariants}
                >
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-neon-green bg-clip-text text-transparent">AI Task Assignment</h1>
                        <p className="text-muted-foreground">Let AI help you create and distribute tasks</p>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card3D>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BrainCircuit className="h-5 w-5 text-primary-500 dark:text-neon-green" />
                                {assignment ? 'Add AI-Generated Tasks to Assignment' : 'Create New Assignment with AI'}
                            </CardTitle>
                            <CardDescription>
                                Describe the assignment and tasks in detail. The AI will generate structured tasks based on your description and distribute them among team members.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Textarea
                                        placeholder={`You are an expert educator and task designer. Create a structured, student-friendly assignment based on the following inputs:

Topic: [Insert topic]
Subject: [Insert subject]
Grade/Level: [Insert level]
Assignment Type: [Insert type]
Learning Outcome/Objective: [Describe the main goal]
Word Count/Length Limit: [e.g., 300–500 words]
Deadline: [Optional, for time-based task breakdowns]

Create an Assignment Title, Introduction, Student Instructions, Task Breakdown, Assessment Criteria, and Optional Resources.`}
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        className="h-64"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Be specific about what the assignment entails, including requirements, format, learning objectives, and any other relevant details.
                                    </p>
                                </div>

                                {error && (
                                    <Alert variant="destructive">
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={isLoading || !prompt.trim()}
                                        className="bg-primary-500 hover:bg-primary-600 dark:bg-neon-green/80 dark:hover:bg-neon-green text-white"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="mr-2 h-4 w-4" />
                                                Generate Tasks
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card3D>
                </motion.div>

                {result && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{result.assignment.title}</CardTitle>
                                <CardDescription>{result.assignment.unit_name}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium">Description</p>
                                        <p className="text-sm text-muted-foreground">{result.assignment.description}</p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <CalendarRange className="h-4 w-4" />
                                            <span>Due: {formatDate(result.assignment.due_date)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Generated Tasks</h2>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAutoDistribute}
                                disabled={isReassigning}
                            >
                                {isReassigning ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                Redistribute Tasks
                            </Button>
                        </div>

                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Task</TableHead>
                                            <TableHead>Assigned To</TableHead>
                                            <TableHead>Due Date</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Effort</TableHead>
                                            <TableHead>Importance</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {result.tasks.map((task, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{task.title}</p>
                                                        <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {task.assigned_to_name || (task.assigned_user_id &&
                                                        group.members.find(m => m.id === task.assigned_user_id)?.name
                                                    ) || 'Unassigned'}
                                                </TableCell>
                                                <TableCell>{formatDate(task.end_date)}</TableCell>
                                                <TableCell>
                                                    <Badge className={getPriorityColor(task.priority)}>
                                                        {task.priority}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                                    <span>{task.effort_hours}h</span>
                                                </TableCell>
                                                <TableCell className="flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3 text-muted-foreground" />
                                                    <span>{task.importance}/5</span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {workloadStatsState && workloadStatsState.distribution.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Member Workload Preview
                            </CardTitle>
                            <CardDescription>
                                This shows how workload would be distributed if these tasks are saved.
                                <span className="text-amber-500 font-medium block mt-1">
                                    Note: Tasks are not saved until you click "Save Assignment"
                                </span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {workloadStatsState.distribution.map((member) => (
                                    <div key={member.id} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{member.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {member.taskCount} tasks
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{member.percentage.toFixed(1)}%</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Total Effort: {member.totalEffort} hours
                                                </p>
                                            </div>
                                        </div>
                                        <Progress value={member.percentage} className="h-2" />
                                        <div className="text-xs text-muted-foreground">
                                            <span>Task Details:</span>
                                            <p>Total Effort: {member.totalEffort} hours</p>
                                            <p>Importance Score: {member.totalImportance}</p>
                                            <div className="mt-1">
                                                {member.tasks.map((task, idx) => (
                                                    <Badge key={idx} variant="outline" className="mr-1 mb-1">
                                                        {task.title}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        {result && (
                            <CardFooter className="flex justify-end p-4 pt-0">
                                <Button onClick={handleSave} disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Assignment'
                                    )}
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                )}

                {/* If we have results but no workload stats, still show the save button */}
                {result && (!workloadStatsState || !workloadStatsState.distribution.length) && (
                    <div className="flex justify-end mt-4">
                        <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Assignment'
                            )}
                        </Button>
                    </div>
                )}
            </motion.div>
        </AppLayout>
    );
}
