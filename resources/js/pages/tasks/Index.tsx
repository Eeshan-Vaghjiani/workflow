import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface Task {
    id: number;
    title: string;
    description: string | null;
    end_date: string;
    status: 'pending' | 'completed';
    assignment: {
        id: number;
        title: string;
        group: {
            id: number;
            name: string;
        };
    };
    assignedUser?: {
        id: number;
        name: string;
    };
}

interface Props {
    tasks: Task[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tasks',
        href: '/group-tasks',
    },
];

export default function Index({ tasks }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tasks" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between mb-4">
                    <h1 className="text-2xl font-bold">Tasks</h1>
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
                            <div key={task.id} className="border rounded-xl p-4 hover:border-blue-500 transition dark:border-neutral-700 bg-white dark:bg-neutral-800">
                                <div className="flex justify-between items-center mb-2">
                                    {task.assignment && task.assignment.group ? (
                                        <Link href={route('group-tasks.show', {
                                            group: task.assignment.group.id,
                                            assignment: task.assignment.id,
                                            task: task.id
                                        })}>
                                            <h2 className="text-xl font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">{task.title}</h2>
                                        </Link>
                                    ) : (
                                        <h2 className="text-xl font-semibold">{task.title}</h2>
                                    )}
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        task.status === 'completed'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300'
                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300'
                                    }`}>
                                        {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{task.description || 'No description'}</p>
                                
                                <div className="mb-3">
                                    <p className="text-sm font-medium">Assigned to:</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {task.assignedUser ? task.assignedUser.name : 'Unassigned'}
                                    </p>
                                </div>
                                
                                {task.assignment && task.assignment.group && (
                                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 dark:text-gray-400">
                                        <div>
                                            <p className="font-medium">Assignment:</p>
                                            <Link href={route('group-assignments.show', { group: task.assignment.group.id, assignment: task.assignment.id })} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                                {task.assignment.title}
                                            </Link>
                                        </div>
                                        <div>
                                            <p className="font-medium">Group:</p>
                                            <Link href={route('groups.show', task.assignment.group.id)} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                                {task.assignment.group.name}
                                            </Link>
                                        </div>
                                    </div>
                                )}
                                <div className="mt-3 text-sm">
                                    <p className="font-medium">Due:</p>
                                    <p>{new Date(task.end_date).toLocaleDateString()}</p>
                                </div>
                                {task.status === 'pending' && (
                                    <div className="mt-4">
                                        <Link
                                            href={route('group-tasks.complete-simple', task.id)}
                                            method="post"
                                            as="button"
                                            className="w-full inline-flex justify-center items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 transition"
                                        >
                                            Mark as Complete
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[50vh] flex items-center justify-center overflow-hidden rounded-xl border">
                        <div className="text-center">
                            <h3 className="text-xl font-semibold mb-2">No Tasks Yet</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">Create a task to start tracking your work.</p>
                            <Link
                                href={route('group-tasks.create')}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 transition"
                            >
                                Create Task
                            </Link>
                        </div>
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/10 dark:stroke-neutral-100/10" />
                    </div>
                )}
            </div>
        </AppLayout>
    );
} 