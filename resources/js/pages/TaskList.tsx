import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CheckSquare, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { csrfRequest } from '../Utils/csrf.js';

interface Task {
    id: number;
    title: string;
    description: string | null;
    status: 'pending' | 'completed';
    end_date: string;
    assigned_to: number | null;
    assigned_user?: {
        id: number;
        name: string;
    };
    assignment?: {
        id: number;
        title: string;
        group?: {
            id: number;
            name: string;
        };
    };
}

interface Props {
    tasks?: Task[];
}

export default function TaskList({ tasks = [] }: Props) {
    // Function to complete a task
    const completeTask = async (taskId: number) => {
        try {
            // Use our csrfRequest utility which handles token refreshing
            await csrfRequest('post', `/tasks/${taskId}/complete`, {});

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

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Tasks',
            href: '/tasks',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tasks" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between mb-4">
                    <h1 className="text-2xl font-bold">My Tasks</h1>
                    <Link
                        href={route('group-tasks.create')}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 transition"
                    >
                        Create Task
                    </Link>
                </div>

                {tasks.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-xl p-4 hover:border-blue-500 transition shadow-sm"
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <h2 className="text-lg font-medium text-blue-600 dark:text-blue-400">{task.title}</h2>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${task.status === 'completed'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300'
                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300'
                                            }`}
                                    >
                                        {task.status === 'completed' ? (
                                            <span className="flex items-center"><CheckSquare className="w-3 h-3 mr-1" /> Completed</span>
                                        ) : (
                                            <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> Pending</span>
                                        )}
                                    </span>
                                </div>

                                {task.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{task.description}</p>
                                )}

                                <div className="mt-3 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Due Date:</span>
                                        <span className="font-medium">{new Date(task.end_date).toLocaleDateString()}</span>
                                    </div>

                                    <div className="mb-3">
                                        <p className="text-sm font-medium">Assigned to:</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            {task.assigned_user ? task.assigned_user.name : 'Unassigned'}
                                        </p>
                                    </div>

                                    {task.assignment && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Assignment:</span>
                                            <span className="font-medium">{task.assignment.title}</span>
                                        </div>
                                    )}

                                    {task.assignment?.group && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Group:</span>
                                            <Link
                                                href={route('groups.show', task.assignment.group.id)}
                                                className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                            >
                                                {task.assignment.group.name}
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 flex space-x-2">
                                    {task.assignment?.group?.id && task.assignment?.id ? (
                                        <Link
                                            href={route('group-tasks.show', {
                                                group: task.assignment.group.id,
                                                assignment: task.assignment.id,
                                                task: task.id
                                            })}
                                            className="flex-1 inline-flex justify-center items-center px-3 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 transition"
                                        >
                                            View Details
                                        </Link>
                                    ) : (
                                        <span
                                            className="flex-1 inline-flex justify-center items-center px-3 py-2 bg-blue-400 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest cursor-not-allowed"
                                        >
                                            View Details
                                        </span>
                                    )}

                                    {task.status === 'pending' && (
                                        <Button
                                            onClick={() => completeTask(task.id)}
                                            className="flex-1 inline-flex justify-center items-center px-3 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 transition"
                                        >
                                            Complete
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-xl p-6 text-center">
                        <div className="flex justify-center mb-4">
                            <CheckSquare className="w-12 h-12 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No Tasks Yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first task to start tracking your work</p>
                        <Link
                            href={route('group-tasks.create')}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 transition"
                        >
                            Create Task
                        </Link>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
