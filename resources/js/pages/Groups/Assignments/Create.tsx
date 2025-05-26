import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

interface Props {
    errors: {
        title?: string;
        description?: string;
        unit_name?: string;
        priority?: string;
        due_date?: string;
    };
    groupId: number;
}

export default function CreateAssignment({ errors, groupId }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Groups', href: '/groups' },
        { title: 'Group', href: `/groups/${groupId}` },
        { title: 'Create Assignment', href: `/groups/${groupId}/assignments/create` },
    ];

    const { data, setData, post, processing } = useForm({
        title: '',
        description: '',
        unit_name: '',
        priority: 'medium',
        due_date: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(`/groups/${groupId}/assignments`, data);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Assignment" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold">Create Assignment</h1>
                    <p className="text-gray-500">Create a new assignment for this group</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Title
                            </label>
                            <input
                                type="text"
                                id="title"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-opacity-50 ${errors.title ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
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
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-opacity-50 ${errors.description ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                            />
                            {errors.description && <div className="text-red-500 text-sm mt-1">{errors.description}</div>}
                        </div>

                        <div className="mb-6">
                            <label htmlFor="unit_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Unit Name
                            </label>
                            <input
                                type="text"
                                id="unit_name"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-opacity-50 ${errors.unit_name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
                                value={data.unit_name}
                                onChange={e => setData('unit_name', e.target.value)}
                                required
                            />
                            {errors.unit_name && <div className="text-red-500 text-sm mt-1">{errors.unit_name}</div>}
                        </div>

                        <div className="mb-6">
                            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Priority
                            </label>
                            <select
                                id="priority"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-opacity-50 ${errors.priority ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
                                value={data.priority}
                                onChange={e => setData('priority', e.target.value)}
                                required
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                            {errors.priority && <div className="text-red-500 text-sm mt-1">{errors.priority}</div>}
                        </div>

                        <div className="mb-6">
                            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Due Date
                            </label>
                            <input
                                type="date"
                                id="due_date"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-opacity-50 ${errors.due_date ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
                                value={data.due_date}
                                onChange={e => setData('due_date', e.target.value)}
                                required
                            />
                            {errors.due_date && <div className="text-red-500 text-sm mt-1">{errors.due_date}</div>}
                        </div>

                        <div className="flex justify-end">
                            <Link href={route('group-assignments.index', { group: groupId })}>
                                <Button variant="outline" className="mr-2">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={processing}>
                                Create Assignment
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
