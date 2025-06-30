import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface Group {
    id: number;
    name: string;
    description: string | null;
    members_count: number;
}

interface Props {
    groups: Group[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Groups',
        href: '/groups',
    },
];

export default function GroupsIndex({ groups }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Groups" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between mb-4">
                    <h1 className="text-2xl font-bold">My Groups</h1>
                    <div>
                        <Link
                            href={route('groups.joinable')}
                            className="inline-flex items-center px-4 py-2 mr-2 bg-gray-200 dark:bg-gray-700 border border-transparent rounded-md font-semibold text-xs text-gray-800 dark:text-white uppercase tracking-widest hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                        >
                            Join a Group
                        </Link>
                        <Link
                            href={route('groups.create')}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 transition"
                        >
                            Create Group
                        </Link>
                    </div>
                </div>

                {groups.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {groups.map((group) => (
                            <div key={group.id} className="border rounded-xl p-4 hover:border-blue-500 transition">
                                <Link href={route('groups.show', group.id)}>
                                    <h2 className="text-xl font-semibold text-blue-600 hover:text-blue-800 mb-2">{group.name}</h2>
                                </Link>
                                <p className="text-sm text-gray-500 mb-4">{group.description || 'No description'}</p>
                                <div className="flex justify-between text-sm">
                                    <span>{group.members_count} {group.members_count === 1 ? 'member' : 'members'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[50vh] flex items-center justify-center overflow-hidden rounded-xl border">
                        <div className="text-center">
                            <h3 className="text-xl font-semibold mb-2">No Groups Yet</h3>
                            <p className="text-gray-500 mb-4">Create a group to start collaborating with others.</p>
                            <Link
                                href={route('groups.create')}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 transition"
                            >
                                Create Group
                            </Link>
                        </div>
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/10 dark:stroke-neutral-100/10" />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
