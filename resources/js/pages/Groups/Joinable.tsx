import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import React from 'react';

interface Group {
    id: number;
    name: string;
    description: string;
    members_count?: number;
    created_at: string;
}

interface Props {
    groups: Group[];
}

export default function Joinable({ groups }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Groups',
            href: '/groups',
        },
        {
            title: 'Join a Group',
            href: '/groups/joinable',
        }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Join a Group" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Available Groups</h1>
                    <div>
                        <Link
                            href={route('groups.index')}
                            className="mr-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 border border-transparent rounded-md font-semibold text-xs text-gray-800 dark:text-white uppercase tracking-widest hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                            My Groups
                        </Link>
                        <Link
                            href={route('groups.create')}
                            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700"
                        >
                            Create Group
                        </Link>
                    </div>
                </div>

                {groups.length === 0 ? (
                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 text-center">
                        <p className="text-gray-500">No groups available to join at this time.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groups.map((group) => (
                            <GroupCard key={group.id} group={group} />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

interface GroupCardProps {
    group: Group;
}

function GroupCard({ group }: GroupCardProps) {
    const { post, processing } = useForm();

    const handleJoinRequest = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('groups.request-join', group.id));
    };

    return (
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <div className="mb-4">
                <h2 className="text-xl font-bold">{group.name}</h2>
                <p className="text-gray-500 text-sm">
                    {group.members_count || 0} {(group.members_count || 0) === 1 ? 'member' : 'members'}
                </p>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
                {group.description || 'No description provided.'}
            </p>
            <div className="flex justify-end">
                <form onSubmit={handleJoinRequest}>
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
                    >
                        {processing ? 'Sending Request...' : 'Request to Join'}
                    </button>
                </form>
            </div>
        </div>
    );
} 