import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Card3D } from '@/components/ui/card-3d';
import { GlassContainer } from '@/components/ui/glass-container';
import { Users, Plus, Settings, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from '@/lib/theme-constants';

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
            <motion.div
                className="flex flex-col gap-4 p-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    className="flex justify-between items-start"
                    variants={itemVariants}
                >
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-neon-green bg-clip-text text-transparent">{group.name}</h1>
                        {group.description && (
                            <p className="mt-2 text-gray-600 dark:text-gray-300">{group.description}</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Link href={route('ai-tasks.index', group.id)}>
                            <EnhancedButton>
                                <Sparkles className="w-4 h-4 mr-2" />
                                AI Tasks
                            </EnhancedButton>
                        </Link>
                        {isLeader && (
                            <>
                                <Link href={route('groups.members.invite', group.id)}>
                                    <EnhancedButton>
                                        <Users className="w-4 h-4 mr-2" />
                                        Invite Members
                                    </EnhancedButton>
                                </Link>
                                <Link href={route('groups.edit', group.id)}>
                                    <EnhancedButton variant="outline">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Edit Group
                                    </EnhancedButton>
                                </Link>
                            </>
                        )}
                    </div>
                </motion.div>

                <motion.div
                    className="grid grid-cols-1 lg:grid-cols-3 gap-4"
                    variants={containerVariants}
                >
                    {/* Left Column - Members */}
                    <motion.div variants={itemVariants}>
                        <Card3D>
                            <CardHeader>
                                <CardTitle className="text-primary-600 dark:text-neon-green">Members</CardTitle>
                                <CardDescription>Group members and their roles</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {group.members.map((member) => (
                                        <motion.div
                                            key={member.id}
                                            className="flex justify-between items-center p-2 hover:bg-gray-50/50 dark:hover:bg-neutral-800/50 rounded-md transition-colors"
                                            whileHover={{ scale: 1.02, x: 5 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                        >
                                            <div>
                                                <div className="font-medium">{member.name}</div>
                                                <div className="text-sm text-gray-500">{member.email}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {member.pivot.role === 'leader' && (
                                                    <span className="px-2 py-1 text-xs bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-neon-green rounded-full">
                                                        Leader
                                                    </span>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}

                                    {isLeader && joinRequests.length > 0 && (
                                        <>
                                            <div className="my-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                                                <h3 className="font-medium text-sm mb-2">Pending Join Requests</h3>
                                                {joinRequests.map((request) => (
                                                    <motion.div
                                                        key={request.id}
                                                        className="flex justify-between items-center p-2 hover:bg-gray-50/50 dark:hover:bg-neutral-800/50 rounded-md"
                                                        whileHover={{ scale: 1.02 }}
                                                    >
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
                                                                className="px-2 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
                                                                preserveScroll
                                                            >
                                                                Approve
                                                            </Link>
                                                            <Link
                                                                href={route('groups.reject-join', group.id)}
                                                                method="post"
                                                                data={{ user_id: request.user.id }}
                                                                as="button"
                                                                className="px-2 py-1 border border-red-500 text-red-500 text-sm rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                preserveScroll
                                                            >
                                                                Reject
                                                            </Link>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card3D>
                    </motion.div>

                    {/* Middle Column - Assignments */}
                    <motion.div variants={itemVariants} className="lg:col-span-2">
                        <GlassContainer blurIntensity="sm" border={true}>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-primary-600 dark:text-neon-green">Assignments</CardTitle>
                                        <CardDescription>Group assignments and tasks</CardDescription>
                                    </div>
                                    {isLeader && (
                                        <Link href={route('group-assignments.create', { group: group.id })}>
                                            <EnhancedButton size="sm">
                                                <Plus className="w-4 h-4 mr-2" />
                                                New Assignment
                                            </EnhancedButton>
                                        </Link>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {group.assignments.length === 0 ? (
                                    <motion.p
                                        className="text-center text-gray-500 py-4"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        No assignments yet
                                    </motion.p>
                                ) : (
                                    <div className="space-y-2">
                                        {group.assignments.map((assignment, index) => (
                                            <motion.div
                                                key={assignment.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 * index }}
                                            >
                                                <Link
                                                    href={route('group-assignments.show', { group: group.id, assignment: assignment.id })}
                                                >
                                                    <motion.div
                                                        className="p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md cursor-pointer shadow-sm border border-gray-100 dark:border-gray-700"
                                                        whileHover={{
                                                            scale: 1.02,
                                                            boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.05)",
                                                            borderColor: "rgba(0, 136, 122, 0.3)"
                                                        }}
                                                    >
                                                        <div className="font-medium text-primary-600 dark:text-neon-green">{assignment.title}</div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                                                        </div>
                                                        {assignment.description && (
                                                            <div className="text-sm mt-2 text-gray-600 dark:text-gray-300 line-clamp-2">
                                                                {assignment.description}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </GlassContainer>
                    </motion.div>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}
