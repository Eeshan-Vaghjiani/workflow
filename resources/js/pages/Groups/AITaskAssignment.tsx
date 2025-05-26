import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BrainCircuit, Loader2, Sparkles, CalendarRange, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';
import { type BreadcrumbItem } from '@/types';

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
}

export default function AITaskAssignment({ group, assignment }: AITaskAssignmentProps) {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AIResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isReassigning, setIsReassigning] = useState(false);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!prompt.trim()) {
            setError('Please enter a description of the assignment tasks');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.post(`/api/groups/${group.id}/ai-tasks/generate`, {
                prompt,
                assignment_id: assignment?.id,
            });

            if (response.data.error) {
                setError(response.data.error);
            } else {
                setResult(response.data);
                toast({
                    title: 'Success!',
                    description: 'AI has generated tasks based on your description',
                });
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'An error occurred while generating tasks');
            toast({
                title: 'Error',
                description: 'Failed to generate tasks. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;

        setIsLoading(true);

        try {
            const url = assignment
                ? `/api/groups/${group.id}/assignments/${assignment.id}/tasks/ai-create`
                : `/api/groups/${group.id}/assignments/ai-create`;

            const response = await axios.post(url, result);

            toast({
                title: 'Success!',
                description: 'Assignment and tasks have been saved',
            });

            // Redirect to the assignment page
            if (response.data.redirect_url) {
                window.location.href = response.data.redirect_url;
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'An error occurred while saving the assignment');
            toast({
                title: 'Error',
                description: 'Failed to save the assignment. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAutoDistribute = async () => {
        if (!result?.tasks) return;

        setIsReassigning(true);

        try {
            const response = await axios.post(`/api/groups/${group.id}/ai-tasks/distribute`, {
                tasks: result.tasks,
                members: group.members
            });

            if (response.data.tasks) {
                setResult({
                    ...result,
                    tasks: response.data.tasks
                });

                toast({
                    title: 'Success!',
                    description: 'Tasks have been automatically distributed among team members',
                });
            }
        } catch (err: any) {
            toast({
                title: 'Error',
                description: 'Failed to redistribute tasks. Please try again.',
                variant: 'destructive',
            });
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
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">AI Task Assignment</h1>
                        <p className="text-muted-foreground">Let AI help you create and distribute tasks</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BrainCircuit className="h-5 w-5 text-primary" />
                            {assignment ? 'Add AI-Generated Tasks to Assignment' : 'Create New Assignment with AI'}
                        </CardTitle>
                        <CardDescription>
                            Describe the assignment and tasks you need to create. The AI will generate structured tasks and distribute them among team members.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Textarea
                                    placeholder="Describe the assignment and what tasks are needed. For example: 'Create a website with a homepage, about page, and contact form. The site should be responsive and include a navigation menu.'"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="h-32"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Be specific about what the assignment entails, including requirements, technologies, and any other relevant details.
                                </p>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="flex justify-end">
                                <Button type="submit" disabled={isLoading || !prompt.trim()}>
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
                </Card>

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
                                            <span>Due: {new Date(result.assignment.due_date).toLocaleDateString()}</span>
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
                                                <TableCell>{new Date(task.end_date).toLocaleDateString()}</TableCell>
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
                            <CardFooter className="flex justify-end p-4 pt-0">
                                <Button onClick={handleSave} disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Assignment & Tasks'
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
