import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';

interface Assignment {
    id: number;
    title: string;
    group: {
        id: number;
        name: string;
    };
}

interface Props {
    assignments: Assignment[];
    selectedAssignmentId?: string | number;
    errors: {
        title?: string;
        description?: string;
        end_date?: string;
        assignment_id?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tasks',
        href: '/group-tasks',
    },
    {
        title: 'Create',
        href: '/group-tasks/create',
    },
];

export default function TasksCreate({ assignments, selectedAssignmentId, errors }: Props) {
    const { data, setData, post, processing } = useForm({
        title: '',
        description: '',
        end_date: '',
        assignment_id: selectedAssignmentId?.toString() || '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(route('group-tasks.store'));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Task" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold">Create Task</h1>
                    <p className="text-gray-500">Create a new task for an assignment</p>
                </div>

                {assignments.length > 0 ? (
                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Task Title
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-opacity-50 ${errors.title ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                                        }`}
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    required
                                />
                                {errors.title && <div className="text-red-500 text-sm mt-1">{errors.title}</div>}
                            </div>

                            <div className="mb-6">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    rows={4}
                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-opacity-50 ${errors.description ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                                        }`}
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                />
                                {errors.description && <div className="text-red-500 text-sm mt-1">{errors.description}</div>}
                            </div>

                            <div className="mb-6">
                                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    id="end_date"
                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-opacity-50 ${errors.end_date ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                                        }`}
                                    value={data.end_date}
                                    onChange={e => setData('end_date', e.target.value)}
                                    required
                                />
                                {errors.end_date && <div className="text-red-500 text-sm mt-1">{errors.end_date}</div>}
                            </div>

                            <div className="mb-6">
                                <label htmlFor="assignment_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Assignment
                                </label>
                                <select
                                    id="assignment_id"
                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-opacity-50 ${errors.assignment_id ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                                        }`}
                                    value={data.assignment_id}
                                    onChange={e => setData('assignment_id', e.target.value)}
                                    required
                                >
                                    <option value="">Select an assignment</option>
                                    {assignments.map(assignment => (
                                        <option key={assignment.id} value={assignment.id}>
                                            {assignment.title} ({assignment.group.name})
                                        </option>
                                    ))}
                                </select>
                                {errors.assignment_id && <div className="text-red-500 text-sm mt-1">{errors.assignment_id}</div>}
                            </div>

                            <div className="flex justify-end">
                                <a
                                    href={route('group-tasks.index')}
                                    className="inline-flex items-center px-4 py-2 mr-3 border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50"
                                >
                                    Cancel
                                </a>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[50vh] flex items-center justify-center overflow-hidden rounded-xl border">
                        <div className="text-center">
                            <h3 className="text-xl font-semibold mb-2">No Assignments Available</h3>
                            <p className="text-gray-500 mb-4">You need to create an assignment before you can add tasks.</p>
                            <a
                                href={route('group-assignments.create')}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 transition"
                            >
                                Create an Assignment
                            </a>
                        </div>
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/10 dark:stroke-neutral-100/10" />
                    </div>
                )}
            </div>
        </AppLayout>
    );
} 