import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Task {
    id: number;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'completed';
    assigned_to: number;
    assignedUser?: User;
    order_index: number;
}

interface Assignment {
    id: number;
    title: string;
    description: string;
    unit_name: string;
    priority: 'low' | 'medium' | 'high';
    due_date: string;
    tasks: Task[];
    group: {
        id: number;
        name: string;
    };
}

interface Props {
    assignment: Assignment;
    isLeader: boolean;
    errors?: Record<string, string>;
}

export default function Show({ assignment, isLeader, errors }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Assignments',
            href: '/group-assignments',
        },
        {
            title: assignment.title,
            href: `/group-assignments/${assignment.id}`,
        },
    ];

    function handleDelete() {
        if (confirm(`Are you sure you want to delete this assignment? This will also delete all associated tasks.`)) {
            router.delete(route('group-assignments.destroy', assignment.id));
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={assignment.title} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold">{assignment.title}</h1>
                        <p className="text-gray-500">{assignment.group.name} - {assignment.unit_name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {isLeader && (
                            <>
                                <Link
                                    href={route('group-assignments.edit', assignment.id)}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest hover:bg-gray-50"
                                >
                                    Edit
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    className="inline-flex items-center px-3 py-2 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest bg-red-600 hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </>
                        )}
                        <Link
                            href={route('group-tasks.create', { assignment_id: assignment.id })}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700"
                        >
                            Add Task
                        </Link>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="mb-6">
                        <p className="text-gray-600 dark:text-gray-300">{assignment.description}</p>
                        <div className="mt-2 flex items-center space-x-4">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Due: {new Date(assignment.due_date).toLocaleDateString()}
                            </span>
                            <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${assignment.priority === 'high'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300'
                                    : assignment.priority === 'medium'
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300'
                                        : 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300'
                                    }`}
                            >
                                {assignment.priority.charAt(0).toUpperCase() + assignment.priority.slice(1)} Priority
                            </span>
                        </div>
                    </div>

                    <h2 className="text-xl font-semibold mb-4">Tasks</h2>
                    <div className="space-y-4">
                        {assignment.tasks.length > 0 ? (
                            assignment.tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="border dark:border-neutral-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">
                                                {task.title}
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-300 mb-2">{task.description}</p>
                                            <div className="flex items-center space-x-4">
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    Due: {new Date(task.end_date).toLocaleDateString()}
                                                </span>
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.priority === 'high'
                                                        ? 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300'
                                                        : task.priority === 'medium'
                                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300'
                                                            : 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300'
                                                        }`}
                                                >
                                                    {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)} Priority
                                                </span>
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.status === 'completed'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300'
                                                        }`}
                                                >
                                                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {task.status === 'pending' && (
                                                <button
                                                    onClick={() => router.post(route('group-tasks.complete', task.id))}
                                                    className="inline-flex items-center px-3 py-1 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700"
                                                >
                                                    Complete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">No tasks yet</p>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
} 