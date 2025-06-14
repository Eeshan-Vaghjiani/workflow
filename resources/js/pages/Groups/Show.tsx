import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, Settings, Sparkles } from 'lucide-react';

interface Member {
    id: number;
    name: string;
    email: string;
    pivot: {
        role: string;
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
    joinRequests?: {
        id: number;
        user: {
            id: number;
            name: string;
            email: string;
        };
        created_at: string;
    }[];
}

export default function GroupShow({ group, isLeader, joinRequests = [] }: Props) {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Group - ${group.name}`} />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold">{group.name}</h1>
                        {group.description && (
                            <p className="mt-2 text-gray-600 dark:text-gray-300">{group.description}</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Link href={route('ai-tasks.index', group.id)}>
                            <Button>
                                <Sparkles className="w-4 h-4 mr-2" />
                                AI Tasks
                            </Button>
                        </Link>
                        {isLeader && (
                            <>
                                <Link href={route('groups.members.invite', group.id)}>
                                    <Button>
                                        <Users className="w-4 h-4 mr-2" />
                                        Invite Members
                                    </Button>
                                </Link>
                                <Link href={route('groups.edit', group.id)}>
                                    <Button variant="outline">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Edit Group
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left Column - Members */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Members</CardTitle>
                            <CardDescription>Group members and their roles</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {group.members.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-md"
                                    >
                                        <div>
                                            <div className="font-medium">{member.name}</div>
                                            <div className="text-sm text-gray-500">{member.email}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {member.pivot.role === 'leader' && (
                                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300 rounded-full">
                                                    Leader
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {isLeader && joinRequests.length > 0 && (
                                    <>
                                        <div className="my-4 border-t pt-4">
                                            <h3 className="font-medium text-sm mb-2">Pending Join Requests</h3>
                                            {joinRequests.map((request) => (
                                                <div key={request.id} className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-md">
                                                    <div>
                                                        <div className="font-medium">{request.user.name}</div>
                                                        <div className="text-sm text-gray-500">{request.user.email}</div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Link
                                                            href={route('groups.approve-join', group.id)}
                                                            method="post"
                                                            data={{ user_id: request.user.id }}
                                                            as="button"
                                                            className="px-2 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                                            preserveScroll
                                                        >
                                                            Approve
                                                        </Link>
                                                        <Link
                                                            href={route('groups.reject-join', group.id)}
                                                            method="post"
                                                            data={{ user_id: request.user.id }}
                                                            as="button"
                                                            className="px-2 py-1 border border-red-500 text-red-500 text-sm rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            preserveScroll
                                                        >
                                                            Reject
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Middle Column - Assignments */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Assignments</CardTitle>
                                    <CardDescription>Group assignments and tasks</CardDescription>
                                </div>
                                {isLeader && (
                                    <Link href={route('group-assignments.create', { group: group.id })}>
                                        <Button size="sm">
                                            <Plus className="w-4 h-4 mr-2" />
                                            New Assignment
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {group.assignments.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">No assignments yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {group.assignments.map((assignment) => (
                                        <Link
                                            key={assignment.id}
                                            href={route('group-assignments.show', { group: group.id, assignment: assignment.id })}
                                        >
                                            <div className="p-2 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-md cursor-pointer">
                                                <div className="font-medium">{assignment.title}</div>
                                                <div className="text-sm text-gray-500">
                                                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
