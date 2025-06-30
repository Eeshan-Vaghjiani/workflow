import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Calendar, GitBranch, Bell, Users, BookOpen, Plus, FileText, Briefcase, Lightbulb, CheckSquare, User, LogOut } from 'lucide-react';
import { Card3D } from '@/components/ui/card-3d';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { motion } from 'framer-motion';
import { PageProps } from "@/types"
import { useState } from "react"
import { containerVariants, itemVariants } from '@/lib/theme-constants';
import { Badge } from '@/components/ui/badge';

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

interface Props extends PageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            ai_prompts_remaining: number;
            total_prompts_purchased: number;
            is_paid_user: boolean;
        }
    }
    groups: Group[];
    notifications: number;
    upcomingTasks: {
        id: number;
        title: string;
        due_date: string;
        is_complete: boolean;
    }[];
    recentAssignments: {
        id: number;
        title: string;
        due_date: string;
        group: {
            id: number;
            name: string;
        }
    }[];
}

// Enhanced AI Usage Progress component
function AIUsageStats({ promptsRemaining, totalPrompts, isPaidUser }: { promptsRemaining: number, totalPrompts: number, isPaidUser: boolean }) {
    // Calculate prompts USED instead of remaining
    const promptsUsed = isPaidUser
        ? totalPrompts - promptsRemaining
        : 10 - promptsRemaining;

    // Calculate the maximum total (either purchased total or 10 for trial users)
    const maxTotal = isPaidUser ? totalPrompts : 10;

    // Calculate percentage USED (not remaining)
    const usagePercentage = maxTotal > 0
        ? Math.max(Math.min((promptsUsed / maxTotal) * 100, 100), 0)
        : 0;

    // Determine status for styling
    let status: 'low' | 'medium' | 'high' = 'low';
    if (usagePercentage >= 75) status = 'high';
    else if (usagePercentage >= 40) status = 'medium';

    const statusColors = {
        low: 'bg-primary',
        medium: 'bg-amber-500',
        high: 'bg-destructive'
    };

    // Format display text
    const usageDisplay = isPaidUser
        ? `${promptsUsed}/${totalPrompts}`
        : `${promptsUsed}/10 (Trial)`;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-foreground" />
                    <h3 className="text-lg font-semibold text-foreground">AI Prompts Usage</h3>
                </div>
                <Badge variant={promptsRemaining < 3 ? "destructive" : "outline"}>
                    {promptsRemaining} left
                </Badge>
            </div>

            <div className="space-y-2">
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                        className={`h-full w-full flex-1 transition-all ${statusColors[status]}`}
                        style={{ transform: `translateX(-${100 - usagePercentage}%)` }}
                    />
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">
                        {usageDisplay} used
                    </span>

                    <Link
                        href="/pricing"
                        className="text-sm text-primary hover:text-primary/90 hover:underline flex items-center gap-1"
                    >
                        <Lightbulb className="h-3.5 w-3.5" />
                        <span>Get more</span>
                    </Link>
                </div>

                {promptsRemaining < 5 && (
                    <div className="text-xs font-medium text-destructive">
                        {promptsRemaining === 0 ? 'No prompts left!' : 'Running low on prompts!'}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Dashboard(props: Props) {
    const { auth, groups = [], notifications = 0, upcomingTasks = [] } = props;
    const [error] = useState<Error | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ];

    // Display error boundary fallback
    if (error) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard" />
                <div className="p-4 text-red-500">
                    An error occurred. Please try refreshing the page.
                </div>
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
                                <h1 className="text-2xl font-bold text-foreground">
                                    Welcome back, {auth.user.name}!
                                </h1>
                                <p className="text-base text-muted-foreground">
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

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div variants={itemVariants}>
                        <Card3D className="p-5">
                            <AIUsageStats
                                promptsRemaining={auth.user.ai_prompts_remaining}
                                totalPrompts={auth.user.total_prompts_purchased}
                                isPaidUser={auth.user.is_paid_user}
                            />
                        </Card3D>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card3D className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Available</h3>
                                <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-full">
                                    <Lightbulb className="w-5 h-5 text-primary dark:text-primary-300" />
                                </div>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-foreground">
                                    {auth.user.is_paid_user ? auth.user.total_prompts_purchased : auth.user.ai_prompts_remaining}
                                </p>
                                <p className="text-muted-foreground text-sm mt-1">
                                    {auth.user.is_paid_user ? 'Total purchased prompts' : 'Free trial prompts remaining'}
                                </p>
                                <div className="mt-4">
                                    <Link href="/ai-tasks" className="text-primary hover:text-primary/90 text-sm font-medium hover:underline">
                                        Generate with AI →
                                    </Link>
                                </div>
                            </div>
                        </Card3D>
                    </motion.div>
                </div>

                {/* Recent AI Generations Section (placeholder) */}
                <motion.div variants={itemVariants}>
                    <Card3D className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent AI Generations</h3>
                            <EnhancedButton
                                variant="outline"
                                size="sm"
                                icon={<Plus className="w-4 h-4" />}
                                iconPosition="left"
                            >
                                <Link href="/ai-tasks">New Generation</Link>
                            </EnhancedButton>
                        </div>

                        <div className="space-y-3">
                            {/* This would be populated with actual AI generations from backend */}
                            <div className="border border-gray-200 dark:border-gray-700 p-3 rounded-lg">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Group Project Tasks</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Generated for Communication Studies</p>
                            </div>
                            <div className="border border-gray-200 dark:border-gray-700 p-3 rounded-lg">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Research Timeline</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Generated for Economics Assignment</p>
                            </div>
                            <Link href="/ai-tasks" className="text-primary dark:text-primary-300 text-sm font-medium hover:underline block text-center mt-4">
                                View all generations →
                            </Link>
                        </div>
                    </Card3D>
                </motion.div>

                {/* Quick Actions */}
                <motion.div variants={itemVariants}>
                    <Card3D className="p-5">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                            <EnhancedButton
                                variant="outline"
                                className="flex flex-col items-center justify-center p-4 h-28"
                                icon={<Users className="w-8 h-8 mb-2" />}
                                iconPosition="top"
                            >
                                <Link href="/groups" className="text-center">
                                    <span className="block">My</span>
                                    <span className="block">Groups</span>
                                </Link>
                            </EnhancedButton>
                            <EnhancedButton
                                variant="outline"
                                className="flex flex-col items-center justify-center p-4 h-28"
                                icon={<FileText className="w-8 h-8 mb-2" />}
                                iconPosition="top"
                            >
                                <Link href="/assignments" className="text-center">
                                    <span className="block">Group</span>
                                    <span className="block">Assignments</span>
                                </Link>
                            </EnhancedButton>
                            <EnhancedButton
                                variant="outline"
                                className="flex flex-col items-center justify-center p-4 h-28"
                                icon={<BookOpen className="w-8 h-8 mb-2" />}
                                iconPosition="top"
                            >
                                <Link href="/study-planner" className="text-center">
                                    <span className="block">Study</span>
                                    <span className="block">Planner</span>
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
                                icon={<User className="w-8 h-8 mb-2" />}
                                iconPosition="top"
                            >
                                <Link href={route('profile.edit')} className="text-center">
                                    <span className="block">My</span>
                                    <span className="block">Profile</span>
                                </Link>
                            </EnhancedButton>
                            <EnhancedButton
                                variant="outline"
                                className="flex flex-col items-center justify-center p-4 h-28"
                                icon={<LogOut className="w-8 h-8 mb-2" />}
                                iconPosition="top"
                            >
                                <Link href={route('logout')} method="post" className="text-center">
                                    <span className="block">Log</span>
                                    <span className="block">Out</span>
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
                            glowColor="rgba(0, 136, 122, 0.15)"
                            hoverScale={1.03}
                        >
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tasks</h2>
                                <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-full">
                                    <CheckSquare className="w-5 h-5 text-primary dark:text-primary-300" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{upcomingTasks.length}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Upcoming tasks</p>
                            <div className="mt-4">
                                <Link href="/tasks" className="text-primary dark:text-primary-300 text-sm font-medium hover:underline">
                                    View all tasks →
                                </Link>
                            </div>
                        </Card3D>
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <Card3D
                            className="p-5"
                            glowColor="rgba(0, 136, 122, 0.15)"
                            hoverScale={1.03}
                        >
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
                                <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-full">
                                    <Bell className="w-5 h-5 text-primary dark:text-primary-300" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{notifications}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Unread notifications</p>
                            <div className="mt-4">
                                <Link href="/notifications" className="text-primary dark:text-primary-300 text-sm font-medium hover:underline">
                                    View all notifications →
                                </Link>
                            </div>
                        </Card3D>
                    </motion.div>
                </div>
            </motion.div>
        </AppLayout>
    );
}
