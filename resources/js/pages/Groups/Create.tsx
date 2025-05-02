import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';

interface Props {
    errors: {
        name?: string;
        description?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Groups',
        href: '/groups',
    },
    {
        title: 'Create',
        href: '/groups/create',
    },
];

export default function GroupsCreate({ errors }: Props) {
    const { data, setData, post, processing } = useForm({
        name: '',
        description: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(route('groups.store'));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Group" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold">Create Group</h1>
                    <p className="text-gray-500">Create a new group to collaborate with others</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Group Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-opacity-50 ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                                    }`}
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                required
                            />
                            {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
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

                        <div className="flex justify-end">
                            <a
                                href={route('groups.index')}
                                className="inline-flex items-center px-4 py-2 mr-3 border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50"
                            >
                                Cancel
                            </a>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
                            >
                                Create Group
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
} 