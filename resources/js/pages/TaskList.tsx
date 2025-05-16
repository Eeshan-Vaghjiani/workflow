import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CheckSquare, Clock } from 'lucide-react';

interface Task {
    id: number;
    title: string;
    description: string | null;
    status: 'pending' | 'completed';
    end_date: string;
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

                                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex justify-between">
                                        <span>Due Date:</span>
                                        <span className="font-medium">{new Date(task.end_date).toLocaleDateString()}</span>
                                    </div>

                                    {task.assignment && (
                                        <div className="flex justify-between mt-1">
                                            <span>Assignment:</span>
                                            <span className="font-medium">{task.assignment.title}</span>
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
                                        <Link
                                            href={route('group-tasks.complete-simple', task.id)}
                                            method="post"
                                            as="button"
                                            className="flex-1 inline-flex justify-center items-center px-3 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 transition"
                                        >
                                            Complete
                                        </Link>
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