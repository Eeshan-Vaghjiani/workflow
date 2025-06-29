import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Calendar, GitBranch, Clock, Bell, Users, BookOpen, Plus, FileText, Briefcase, Settings, TrendingUp } from 'lucide-react';
import { Card3D } from '@/components/ui/card-3d';
import { GlassContainer } from '@/components/ui/glass-container';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { motion, AnimatePresence } from 'framer-motion';
import { PageProps } from "@/types"
import { useState, useEffect, useMemo } from "react"
import { containerVariants, itemVariants } from '@/lib/theme-constants';

interface Group {
    id: number;
    name: string;
    members_count: number;
    assignments_count: number;
    avatar?: string;
    lastMessage?: {
        content: string;
        timestamp: string;
    };
    unreadCount?: number;
}

interface Assignment {
    id: number;
    title: string;
    description: string;
    due_date: string;
    group: {
        id: number;
        name: string;
    };
}

interface Task {
    id: number;
    title: string;
    end_date: string;
    status: 'pending' | 'in_progress' | 'completed';
    assignment: {
        id: number;
        title: string;
    };
}

interface Props extends PageProps {
    groups: Group[];
    assignments: Assignment[];
    tasks: Task[];
    unreadNotificationsCount: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
    return (
        <GlassContainer className="p-4 text-red-500">
            <h2 className="text-lg font-semibold">Something went wrong:</h2>
            <pre className="mt-2 text-sm">{error.message}</pre>
            <EnhancedButton
                onClick={resetErrorBoundary}
                className="mt-4"
                variant="danger"
            >
                Try again
            </EnhancedButton>
        </GlassContainer>
    )
}

function LoadingState() {
    return (
        <div className="flex items-center justify-center h-screen">
            <motion.div
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                }}
            >
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 dark:border-neon-green mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
            </motion.div>
        </div>
    );
}

export default function Dashboard(props: Props) {
    // Initialize state with safe default values
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Safely destructure props with defaults
    const {
        groups: initialGroups = [],
        assignments = [],
        tasks = [],
        unreadNotificationsCount = 0,
        auth
    } = props;

    const [groups, setGroups] = useState<Group[]>(initialGroups);

    // Memoize the upcoming tasks calculation
    const upcomingTasks = useMemo(() => {
        try {
            if (!Array.isArray(tasks)) return [];

            const today = new Date();
            const threeDaysFromNow = new Date(today);
            threeDaysFromNow.setDate(today.getDate() + 3);

            return tasks.filter(task => {
                if (!task || typeof task !== 'object') return false;
                if (!task.end_date || !task.status) return false;

                try {
                    const dueDate = new Date(task.end_date);
                    return task.status !== 'completed' && dueDate <= threeDaysFromNow;
                } catch (e) {
                    console.error('Error processing task date:', e);
                    return false;
                }
            });
        } catch (e) {
            console.error('Error calculating upcoming tasks:', e);
            return [];
        }
    }, [tasks]);

    // Handle component initialization
    useEffect(() => {
        try {
            // Validate required data
            if (!auth?.user) {
                throw new Error('User authentication data is missing');
            }

            // Set up chat listener
            const channel = window.Echo?.channel(`group-chat`);
            if (channel) {
                channel.listen('NewGroupMessage', (event) => {
                    console.log('Received message event:', event);

                    // Update unread count for the group
                    setGroups(prev => prev.map(group => {
                        if (group.id === event.groupId && event.message.sender.id !== auth.user.id) {
                            return {
                                ...group,
                                unreadCount: (group.unreadCount || 0) + 1,
                                lastMessage: {
                                    content: event.message.content,
                                    timestamp: event.message.timestamp
                                }
                            };
                        }
                        return group;
                    }));
                });
            }

            // Simulate loading state
            const timer = setTimeout(() => {
                setIsLoading(false);
            }, 500);

            return () => {
                clearTimeout(timer);
                if (channel) {
                    channel.stopListening('NewGroupMessage');
                }
            };
        } catch (e) {
            setError(e instanceof Error ? e : new Error('An unknown error occurred'));
            setIsLoading(false);
        }
    }, [auth]);

    if (isLoading) {
        return <LoadingState />;
    }

    if (error) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard" />
                <ErrorFallback error={error} resetErrorBoundary={() => setError(null)} />
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-4 max-w-full"
            >
                {/* Welcome Card */}
                <motion.div variants={itemVariants} className="w-full">
                    <Card3D
                        className="p-5 bg-gradient-to-br from-primary-50 to-white dark:from-gray-800/80 dark:to-gray-900/90"
                        glowColor="rgba(0, 136, 122, 0.15)"
                        hoverScale={1.01}
                    >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Welcome back, {auth.user.name}!
                                </h1>
                                <p className="text-base text-gray-600 dark:text-gray-300">
                                    Here's what's happening in your workspace today
                                </p>
                            </div>
                            <div className="flex gap-2 self-end md:self-auto">
                                <EnhancedButton
                                    size="md"
                                    variant="outline"
                                    icon={<Calendar className="w-4 h-4" />}
                                    iconPosition="left"
                                >
                                    <Link href="/calendar">Calendar</Link>
                                </EnhancedButton>
                                <EnhancedButton
                                    size="md"
                                    variant="primary"
                                    icon={<GitBranch className="w-4 h-4" />}
                                    iconPosition="left"
                                >
                                    <Link href="/tasks" className="text-white dark:text-black">Tasks</Link>
                                </EnhancedButton>
                            </div>
                        </div>
                    </Card3D>
                </motion.div>

                {/* Quick Actions */}
                <motion.div variants={itemVariants} className="w-full">
                    <Card3D
                        className="p-5"
                        glowColor="rgba(119, 166, 247, 0.15)"
                        hoverScale={1.02}
                    >
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quick Actions</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            <EnhancedButton
                                variant="outline"
                                className="flex flex-col items-center justify-center p-4 h-28"
                                icon={<FileText className="w-8 h-8 mb-2" />}
                                iconPosition="top"
                            >
                                <Link href="/assignments/create" className="text-center">
                                    <span className="block">New</span>
                                    <span className="block">Assignment</span>
                                </Link>
                            </EnhancedButton>
                            <EnhancedButton
                                variant="outline"
                                className="flex flex-col items-center justify-center p-4 h-28"
                                icon={<Users className="w-8 h-8 mb-2" />}
                                iconPosition="top"
                            >
                                <Link href="/groups/create" className="text-center">
                                    <span className="block">Create</span>
                                    <span className="block">Group</span>
                                </Link>
                            </EnhancedButton>
                            <EnhancedButton
                                variant="outline"
                                className="flex flex-col items-center justify-center p-4 h-28"
                                icon={<Briefcase className="w-8 h-8 mb-2" />}
                                iconPosition="top"
                            >
                                <Link href="/tasks/create" className="text-center">
                                    <span className="block">New</span>
                                    <span className="block">Task</span>
                                </Link>
                            </EnhancedButton>
                            <EnhancedButton
                                variant="outline"
                                className="flex flex-col items-center justify-center p-4 h-28"
                                icon={<TrendingUp className="w-8 h-8 mb-2" />}
                                iconPosition="top"
                            >
                                <Link href="/ai-tasks" className="text-center">
                                    <span className="block">AI</span>
                                    <span className="block">Tasks</span>
                                </Link>
                            </EnhancedButton>
                            <EnhancedButton
                                variant="outline"
                                className="flex flex-col items-center justify-center p-4 h-28"
                                icon={<Settings className="w-8 h-8 mb-2" />}
                                iconPosition="top"
                            >
                                <Link href="/settings" className="text-center">
                                    <span className="block">Account</span>
                                    <span className="block">Settings</span>
                                </Link>
                            </EnhancedButton>
                        </div>
                    </Card3D>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div variants={itemVariants}>
                        <Card3D
                            className="p-5"
                            glowColor="rgba(0, 136, 122, 0.15)"
                            hoverScale={1.03}
                        >
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Groups</h2>
                                <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-full">
                                    <Users className="w-5 h-5 text-primary dark:text-primary-300" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{groups.length}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Active groups</p>
                            <div className="mt-4">
                                <Link href="/groups" className="text-primary dark:text-primary-300 text-sm font-medium hover:underline">
                                    View all groups →
                                </Link>
                            </div>
                        </Card3D>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card3D
                            className="p-5"
                            glowColor="rgba(119, 166, 247, 0.15)"
                            hoverScale={1.03}
                        >
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Assignments</h2>
                                <div className="bg-ctaBright/10 dark:bg-ctaBright/20 p-2 rounded-full">
                                    <BookOpen className="w-5 h-5 text-ctaBright dark:text-ctaBright" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{assignments.length}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Active assignments</p>
                            <div className="mt-4">
                                <Link href="/assignments" className="text-ctaBright dark:text-ctaBright text-sm font-medium hover:underline">
                                    View all assignments →
                                </Link>
                            </div>
                        </Card3D>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card3D
                            className="p-5"
                            glowColor="rgba(255, 204, 188, 0.15)"
                            hoverScale={1.03}
                        >
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
                                <div className="bg-accent/20 dark:bg-accent/30 p-2 rounded-full">
                                    <Bell className="w-5 h-5 text-accent-coral dark:text-accent-coral" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{unreadNotificationsCount}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Unread notifications</p>
                            <div className="mt-4">
                                <Link href="/notifications" className="text-accent-coral dark:text-accent-coral text-sm font-medium hover:underline">
                                    View all notifications →
                                </Link>
                            </div>
                        </Card3D>
                    </motion.div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Upcoming Tasks */}
                    <motion.div variants={itemVariants} className="md:col-span-2">
                        <Card3D
                            className="p-5"
                            glowColor="rgba(0, 136, 122, 0.1)"
                            hoverScale={1.02}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Tasks</h2>
                                <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-full">
                                    <Clock className="w-5 h-5 text-primary dark:text-primary-300" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <AnimatePresence>
                                    {upcomingTasks.length > 0 ? (
                                        upcomingTasks.map((task, index) => (
                                            <motion.div
                                                key={task.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ delay: index * 0.1 }}
                                            >
                                                <GlassContainer
                                                    className="p-3"
                                                    hoverEffect={true}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <h3 className="font-medium text-base text-gray-900 dark:text-white">{task.title}</h3>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {task.assignment?.title || 'No assignment'}
                                                            </p>
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            Due: {new Date(task.end_date).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </GlassContainer>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <GlassContainer className="p-4 text-center">
                                                <p className="text-gray-500 dark:text-gray-400">No upcoming tasks</p>
                                            </GlassContainer>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="mt-4">
                                <Link href="/tasks" className="text-primary dark:text-primary-300 text-sm font-medium hover:underline">
                                    View all tasks →
                                </Link>
                            </div>
                        </Card3D>
                    </motion.div>

                    {/* Recent Groups */}
                    <motion.div variants={itemVariants} className="md:col-span-1">
                        <Card3D
                            className="p-5 h-full"
                            glowColor="rgba(119, 166, 247, 0.1)"
                            hoverScale={1.02}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Groups</h2>
                                <div className="bg-ctaBright/10 dark:bg-ctaBright/20 p-2 rounded-full">
                                    <Users className="w-5 h-5 text-ctaBright dark:text-ctaBright" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <AnimatePresence>
                                    {groups.length > 0 ? (
                                        groups.slice(0, 5).map((group, index) => (
                                            <motion.div
                                                key={group.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ delay: index * 0.1 }}
                                            >
                                                <GlassContainer
                                                    className="p-3"
                                                    hoverEffect={true}
                                                >
                                                    <Link href={`/groups/${group.id}`} className="flex justify-between items-center">
                                                        <div>
                                                            <h3 className="font-medium text-base text-gray-900 dark:text-white">{group.name}</h3>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {group.members_count} members
                                                            </p>
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {group.assignments_count} assignments
                                                        </div>
                                                    </Link>
                                                </GlassContainer>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <GlassContainer className="p-4 text-center">
                                                <p className="text-gray-500 dark:text-gray-400">No groups</p>
                                            </GlassContainer>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="mt-4">
                                <EnhancedButton
                                    size="sm"
                                    variant="outline"
                                    className="w-full"
                                    icon={<Plus className="w-4 h-4" />}
                                    iconPosition="left"
                                >
                                    <Link href="/groups/create">Create new group</Link>
                                </EnhancedButton>
                            </div>
                        </Card3D>
                    </motion.div>
                </div>
            </motion.div>
        </AppLayout>
    );
}
