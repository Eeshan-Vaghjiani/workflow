import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface Task {
    id: number;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string;
    status: 'pending' | 'completed';
    priority: 'low' | 'medium' | 'high';
    assignment: {
        id: number;
        title: string;
        group: {
            id: number;
            name: string;
        };
    };
    assignedUser: {
        id: number;
        name: string;
    };
}

interface Props {
    task: Task;
}

export default function Show({ task }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Tasks',
            href: route('group-tasks.index'),
        },
        {
            title: task.title,
            href: task.assignment && task.assignment.group 
                ? route('group-tasks.show', {
                    group: task.assignment.group.id,
                    assignment: task.assignment.id,
                    task: task.id
                })
                : route('group-tasks.index'),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={task.title} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex justify-between items-start mb-6">
                        <h1 className="text-2xl font-bold">{task.title}</h1>
                        <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                            </span>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.priority === 'high'
                                    ? 'bg-red-100 text-red-800'
                                    : task.priority === 'medium'
                                        ? 'bg-orange-100 text-orange-800'
                                        : 'bg-blue-100 text-blue-800'
                                }`}>
                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                            </span>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-lg font-medium mb-2">Description</h2>
                        <p className="text-gray-700 dark:text-gray-300">
                            {task.description || 'No description provided.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h2 className="text-lg font-medium mb-2">Details</h2>
                            <ul className="space-y-2">
                                <li className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Start Date:</span>
                                    <span>{new Date(task.start_date).toLocaleDateString()}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Due Date:</span>
                                    <span>{new Date(task.end_date).toLocaleDateString()}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Assigned To:</span>
                                    <span>{task.assignedUser?.name || 'Unassigned'}</span>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h2 className="text-lg font-medium mb-2">Related</h2>
                            <ul className="space-y-2">
                                {task.assignment && (
                                    <li className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Assignment:</span>
                                        {task.assignment.group && (
                                            <Link
                                                href={route('group-assignments.show', { group: task.assignment.group.id, assignment: task.assignment.id })}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                {task.assignment.title}
                                            </Link>
                                        )}
                                    </li>
                                )}
                                {task.assignment && task.assignment.group && (
                                    <li className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Group:</span>
                                        <Link
                                            href={route('groups.show', task.assignment.group.id)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            {task.assignment.group.name}
                                        </Link>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    <div className="flex justify-between mt-8">
                        <div>
                            <Link
                                href={route('group-tasks.index')}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50"
                            >
                                Back to Tasks
                            </Link>
                        </div>
                        <div className="flex space-x-2">
                            {task.status === 'pending' && (
                                <Link
                                    href={route('group-tasks.complete-simple', task.id)}
                                    method="post"
                                    as="button"
                                    className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700"
                                >
                                    Mark as Complete
                                </Link>
                            )}
                            <Link
                                href={route('group-tasks.edit-simple', task.id)}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700"
                            >
                                Edit Task
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
} 