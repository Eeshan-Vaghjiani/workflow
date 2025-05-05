import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';

interface Group {
    id: number;
    name: string;
}

interface Assignment {
    id: number;
    title: string;
    description: string | null;
    unit_name: string;
    due_date: string;
    group_id: number;
    group: Group;
}

interface Props {
    assignment: Assignment;
    errors: {
        title?: string;
        description?: string;
        due_date?: string;
        unit_name?: string;
    };
}

export default function AssignmentsEdit({ assignment, errors }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Assignments',
            href: '/group-assignments',
        },
        {
            title: assignment.title,
            href: `/group-assignments/${assignment.id}`,
        },
        {
            title: 'Edit',
            href: `/group-assignments/${assignment.id}/edit`,
        },
    ];

    const { data, setData, put, processing } = useForm({
        title: assignment.title,
        description: assignment.description || '',
        due_date: assignment.due_date,
        unit_name: assignment.unit_name,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(route('group-assignments.update', assignment.id));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${assignment.title}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold">Edit Assignment</h1>
                    <p className="text-gray-500">Update assignment details</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Assignment Title
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
                            <label htmlFor="unit_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Unit Name
                            </label>
                            <input
                                type="text"
                                id="unit_name"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-opacity-50 ${errors.unit_name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                                    }`}
                                value={data.unit_name}
                                onChange={e => setData('unit_name', e.target.value)}
                            />
                            {errors.unit_name && <div className="text-red-500 text-sm mt-1">{errors.unit_name}</div>}
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
                            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Due Date
                            </label>
                            <input
                                type="date"
                                id="due_date"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-opacity-50 ${errors.due_date ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                                    }`}
                                value={data.due_date}
                                onChange={e => setData('due_date', e.target.value)}
                                required
                            />
                            {errors.due_date && <div className="text-red-500 text-sm mt-1">{errors.due_date}</div>}
                        </div>

                        <div className="flex justify-end">
                            <a
                                href={route('group-assignments.show', assignment.id)}
                                className="inline-flex items-center px-4 py-2 mr-3 border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50"
                            >
                                Cancel
                            </a>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
                            >
                                Update Assignment
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
} 