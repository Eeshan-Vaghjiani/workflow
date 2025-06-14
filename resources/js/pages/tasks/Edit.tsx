import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface GroupMember {
    id: number;
    name: string;
    email: string;
}

interface Task {
    id: number;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string;
    status: 'pending' | 'completed';
    priority: 'low' | 'medium' | 'high';
    assignment_id: number;
    assignment: {
        id: number;
        group_id: number;
        due_date?: string;
    };
    assigned_to: number | null;
    effort_hours: number;
    importance: number;
}

interface Props {
    task: Task;
    group_members: GroupMember[];
    errors: Record<string, string>;
}

export default function Edit({ task, group_members, errors }: Props) {
    const today = new Date().toISOString().split('T')[0];
    const [maxDate, setMaxDate] = useState<string>(task.assignment?.due_date || '');

    const { data, setData, put, processing } = useForm({
        title: task.title,
        description: task.description || '',
        end_date: task.end_date,
        assigned_to: task.assigned_to?.toString() || '',
        status: task.status,
        priority: task.priority,
        effort_hours: task.effort_hours?.toString() || '1',
        importance: task.importance?.toString() || '3',
    });

    // Set the maximum date based on the assignment due date
    useEffect(() => {
        if (task.assignment?.due_date) {
            setMaxDate(task.assignment.due_date);
        } else {
            // Default to 1 month from now if no assignment due date
            const oneMonthLater = new Date();
            oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
            setMaxDate(oneMonthLater.toISOString().split('T')[0]);
        }
    }, [task.assignment]);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Tasks',
            href: route('group-tasks.index'),
        },
        {
            title: task.title,
            href: task.assignment && task.assignment.group_id
                ? route('group-tasks.show', {
                    group: task.assignment.group_id,
                    assignment: task.assignment_id,
                    task: task.id
                })
                : route('group-tasks.index'),
        },
        {
            title: 'Edit',
            href: route('group-tasks.edit-simple', task.id),
        },
    ];

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(route('group-tasks.update-simple', task.id));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Task: ${task.title}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold">Edit Task</h1>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    required
                                />
                                {errors.title && <div className="text-red-500 text-sm mt-1">{errors.title}</div>}
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    rows={4}
                                />
                                {errors.description && <div className="text-red-500 text-sm mt-1">{errors.description}</div>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        id="end_date"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={data.end_date}
                                        onChange={e => setData('end_date', e.target.value)}
                                        min={today}
                                        max={maxDate}
                                        required
                                    />
                                    {errors.end_date && <div className="text-red-500 text-sm mt-1">{errors.end_date}</div>}
                                    <p className="text-xs text-gray-500 mt-1">
                                        Must be between today and the assignment due date ({maxDate})
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Assigned To
                                    </label>
                                    <select
                                        id="assigned_to"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={data.assigned_to}
                                        onChange={e => setData('assigned_to', e.target.value)}
                                    >
                                        <option value="">Select User</option>
                                        {group_members.map(member => (
                                            <option key={member.id} value={member.id}>
                                                {member.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.assigned_to && <div className="text-red-500 text-sm mt-1">{errors.assigned_to}</div>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Priority
                                    </label>
                                    <select
                                        id="priority"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={data.priority}
                                        onChange={e => setData('priority', e.target.value as 'low' | 'medium' | 'high')}
                                        required
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                    {errors.priority && <div className="text-red-500 text-sm mt-1">{errors.priority}</div>}
                                </div>

                                <div>
                                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Status
                                    </label>
                                    <select
                                        id="status"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={data.status}
                                        onChange={e => setData('status', e.target.value as 'pending' | 'completed')}
                                        required
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                    {errors.status && <div className="text-red-500 text-sm mt-1">{errors.status}</div>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="effort_hours" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Effort (hours)
                                    </label>
                                    <input
                                        type="number"
                                        id="effort_hours"
                                        min="1"
                                        max="100"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={data.effort_hours}
                                        onChange={e => setData('effort_hours', e.target.value)}
                                    />
                                    {errors.effort_hours && <div className="text-red-500 text-sm mt-1">{errors.effort_hours}</div>}
                                    <p className="text-xs text-gray-500 mt-1">Estimated hours to complete this task</p>
                                </div>

                                <div>
                                    <label htmlFor="importance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Importance
                                    </label>
                                    <select
                                        id="importance"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={data.importance}
                                        onChange={e => setData('importance', e.target.value)}
                                    >
                                        <option value="1">1 (Lowest)</option>
                                        <option value="2">2</option>
                                        <option value="3">3 (Medium)</option>
                                        <option value="4">4</option>
                                        <option value="5">5 (Highest)</option>
                                    </select>
                                    {errors.importance && <div className="text-red-500 text-sm mt-1">{errors.importance}</div>}
                                    <p className="text-xs text-gray-500 mt-1">How critical this task is to the assignment</p>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <a
                                    href={task.assignment && task.assignment.group_id
                                        ? route('group-tasks.show', {
                                            group: task.assignment.group_id,
                                            assignment: task.assignment_id,
                                            task: task.id
                                        })
                                        : route('group-tasks.index')
                                    }
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50"
                                >
                                    Cancel
                                </a>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Update Task
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
