import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Member {
    id: number;
    name: string;
    email: string;
    pivot: {
        is_leader: boolean;
    };
}

interface Assignment {
    id: number;
    title: string;
    description: string;
    unit_name: string;
    due_date: string;
}

interface Group {
    id: number;
    name: string;
    description: string;
    members: Member[];
    assignments: Assignment[];
}

interface Props {
    group: Group;
    isLeader: boolean;
    errors?: Record<string, string>;
}

type TabType = 'assignments' | 'members';

export default function GroupShow({ group, isLeader, errors }: Props) {
    const [activeTab, setActiveTab] = useState<TabType>('assignments');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Groups',
            href: '/groups',
        },
        {
            title: group.name,
            href: `/groups/${group.id}`,
        },
    ];

    function handleDeleteMember(memberId: number) {
        if (confirm(`Are you sure you want to remove this member from the group?`)) {
            router.delete(route('groups.members.destroy', { group: group.id, user: memberId }));
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={group.name} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold">{group.name}</h1>
                        <p className="text-gray-500">{group.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {isLeader && (
                            <>
                                <Link
                                    href={route('groups.edit', group.id)}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest hover:bg-gray-50"
                                >
                                    Edit Group
                                </Link>
                            </>
                        )}
                        <Link
                            href={route('group-assignments.create', { group_id: group.id })}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700"
                        >
                            New Assignment
                        </Link>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                    {/* Tabs */}
                    <div className="border-b border-neutral-200 dark:border-neutral-700">
                        <nav className="flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab('assignments')}
                                className={`${activeTab === 'assignments'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Assignments
                            </button>
                            <button
                                onClick={() => setActiveTab('members')}
                                className={`${activeTab === 'members'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Members
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'assignments' && (
                            <div className="space-y-4">
                                {group.assignments?.length > 0 ? (
                                    group.assignments.map((assignment) => (
                                        <div
                                            key={assignment.id}
                                            className="border dark:border-neutral-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <Link href={route('group-assignments.show', assignment.id)}>
                                                <h3 className="text-lg font-semibold mb-2">
                                                    {assignment.title}
                                                </h3>
                                            </Link>
                                            <p className="text-gray-600 dark:text-gray-300 mb-2">
                                                {assignment.description}
                                            </p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    Unit: {assignment.unit_name}
                                                </span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400">No assignments yet</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'members' && (
                            <div>
                                {isLeader && (
                                    <div className="mb-4">
                                        <Link
                                            href={route('groups.members.invite', group.id)}
                                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest hover:bg-gray-50"
                                        >
                                            Invite Member
                                        </Link>
                                    </div>
                                )}
                                <div className="space-y-4">
                                    {group.members?.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-4 border dark:border-neutral-700 rounded-lg"
                                        >
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <p className="font-medium">{member.name}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-2 py-1 rounded-full text-xs ${member.pivot.is_leader ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300'}`}>
                                                    {member.pivot.is_leader ? 'Leader' : 'Member'}
                                                </span>
                                                {isLeader && !member.pivot.is_leader && (
                                                    <button
                                                        onClick={() => handleDeleteMember(member.id)}
                                                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
} 