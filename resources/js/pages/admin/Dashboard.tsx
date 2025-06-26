import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { motion, Variants } from 'framer-motion';
import {
    Users,
    UserCheck,
    Activity,
    Clock,
    ChevronRight,
    MessageSquare,
    FileText,
    CheckCircle,
    AlertCircle,
    BarChart3,
    TrendingUp,
    TrendingDown
} from 'lucide-react';
import { Card3D } from '@/components/ui/card-3d';
import { GlassContainer } from '@/components/ui/glass-container';
import { EnhancedButton } from '@/components/ui/enhanced-button';

// Animation variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};

// Stats Card Component
interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    change?: string;
    positive?: boolean;
    bgColor?: string;
    delay?: number;
}

const StatsCard = ({ title, value, icon, change, positive = true, delay = 0 }: StatsCardProps) => {
    return (
        <Card3D
            className="p-6"
            rotationIntensity={15}
            hoverScale={1.03}
            glowColor={positive ? 'rgba(0, 136, 122, 0.15)' : 'rgba(239, 68, 68, 0.15)'}
        >
            <motion.div
                variants={itemVariants}
                transition={{ delay }}
                className="relative z-10"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                        <div className="flex items-baseline mt-1">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
                            {change && (
                                <motion.span
                                    className={`ml-2 text-sm font-medium flex items-center ${positive ? 'text-green-500' : 'text-red-500'}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: delay + 0.3, duration: 0.3 }}
                                >
                                    {positive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                    {positive ? '+' : ''}{change}
                                </motion.span>
                            )}
                        </div>
                    </div>
                    <motion.div
                        className={`p-4 rounded-full ${positive ? 'bg-softBlue dark:bg-primary-600/20 text-primary-500 dark:text-neon-green' : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}
                        whileHover={{
                            rotate: [0, -10, 10, -10, 0],
                            transition: { duration: 0.5 }
                        }}
                    >
                        {icon}
                    </motion.div>
                </div>
            </motion.div>
        </Card3D>
    );
};

// Recent Activity Card Component
interface ActivityItem {
    id: number;
    user: string;
    action: string;
    time: string;
    status?: 'success' | 'warning' | 'error';
}

const recentActivities: ActivityItem[] = [
    { id: 1, user: 'John Doe', action: 'Created a new group', time: '5 mins ago', status: 'success' },
    { id: 2, user: 'Sarah Smith', action: 'Updated user profile', time: '10 mins ago', status: 'success' },
    { id: 3, user: 'Mike Johnson', action: 'Failed login attempt', time: '25 mins ago', status: 'error' },
    { id: 4, user: 'Emily Brown', action: 'Deleted a task', time: '1 hour ago', status: 'warning' },
    { id: 5, user: 'David Wilson', action: 'Added new user', time: '2 hours ago', status: 'success' },
];

const ActivityCard = () => {
    return (
        <GlassContainer
            className="p-6"
            blurIntensity="sm"
            hoverEffect
        >
            <motion.div
                variants={itemVariants}
                className="relative z-10"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                    <EnhancedButton
                        variant="ghost"
                        size="sm"
                        icon={<ChevronRight className="h-4 w-4" />}
                        iconPosition="right"
                    >
                        View all
                    </EnhancedButton>
                </div>
                <motion.div
                    className="space-y-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {recentActivities.map((activity, index) => (
                        <motion.div
                            key={activity.id}
                            className="flex items-start"
                            variants={itemVariants}
                            custom={index}
                            whileHover={{ x: 5, transition: { duration: 0.2 } }}
                        >
                            <motion.div
                                className={`p-2 rounded-full mr-3 ${activity.status === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                                    activity.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                                        'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                    }`}
                                whileHover={{ scale: 1.2 }}
                            >
                                {activity.status === 'success' ? <CheckCircle className="h-4 w-4" /> :
                                    activity.status === 'warning' ? <AlertCircle className="h-4 w-4" /> :
                                        <AlertCircle className="h-4 w-4" />}
                            </motion.div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.user}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{activity.action}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{activity.time}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>
        </GlassContainer>
    );
};

// Quick Actions Component
interface QuickAction {
    id: number;
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
}

const quickActions: QuickAction[] = [
    {
        id: 1,
        title: 'Add New User',
        description: 'Create a new user account',
        icon: <Users className="h-5 w-5" />,
        href: '/admin/users/create'
    },
    {
        id: 2,
        title: 'Manage Groups',
        description: 'View and edit groups',
        icon: <UserCheck className="h-5 w-5" />,
        href: '/admin/groups'
    },
    {
        id: 3,
        title: 'View Reports',
        description: 'Access analytics reports',
        icon: <BarChart3 className="h-5 w-5" />,
        href: '/admin/analytics'
    },
    {
        id: 4,
        title: 'System Settings',
        description: 'Configure platform settings',
        icon: <Activity className="h-5 w-5" />,
        href: '/admin/settings'
    },
];

const QuickActionsCard = () => {
    return (
        <Card3D className="p-6">
            <motion.div variants={itemVariants} className="relative z-10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quickActions.map((action, index) => (
                        <motion.a
                            key={action.id}
                            href={action.href}
                            className="flex items-center p-4 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-softBlue/20 dark:hover:bg-gray-700/30 transition-colors"
                            variants={itemVariants}
                            custom={index}
                            whileHover={{
                                scale: 1.03,
                                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                                transition: { type: "spring", stiffness: 400, damping: 15 }
                            }}
                        >
                            <motion.div
                                className="p-2 rounded-lg bg-softBlue dark:bg-primary-600/20 text-primary-500 dark:text-neon-green mr-4"
                                whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
                            >
                                {action.icon}
                            </motion.div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{action.title}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{action.description}</p>
                            </div>
                            <motion.div
                                className="ml-auto opacity-0 text-primary-500 dark:text-neon-green"
                                whileHover={{ opacity: 1, x: 0 }}
                                initial={{ opacity: 0, x: -10 }}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </motion.div>
                        </motion.a>
                    ))}
                </div>
            </motion.div>
        </Card3D>
    );
};

// System Health Component
interface SystemMetric {
    id: number;
    name: string;
    value: number;
    status: 'good' | 'warning' | 'critical';
}

const systemMetrics: SystemMetric[] = [
    { id: 1, name: 'CPU Usage', value: 42, status: 'good' },
    { id: 2, name: 'Memory Usage', value: 68, status: 'warning' },
    { id: 3, name: 'Disk Space', value: 24, status: 'good' },
    { id: 4, name: 'Response Time', value: 89, status: 'critical' },
];

const SystemHealthCard = () => {
    return (
        <GlassContainer className="p-6 overflow-hidden" blurIntensity="md">
            <motion.div variants={itemVariants} className="relative z-10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Health</h3>
                <div className="space-y-4">
                    {systemMetrics.map((metric, index) => (
                        <motion.div
                            key={metric.id}
                            className="space-y-2"
                            variants={itemVariants}
                            custom={index}
                            initial="hidden"
                            animate="visible"
                            whileHover={{ scale: 1.02, x: 5 }}
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{metric.name}</span>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${metric.status === 'good' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                    metric.status === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                    {metric.value}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                <motion.div
                                    className={`h-2 rounded-full ${metric.status === 'good' ? 'bg-green-500' :
                                        metric.status === 'warning' ? 'bg-yellow-500' :
                                            'bg-red-500'
                                        }`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${metric.value}%` }}
                                    transition={{
                                        delay: 0.3 + (index * 0.1),
                                        duration: 0.8,
                                        ease: "easeOut"
                                    }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Decorative background element */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-r from-primary-500/10 to-neon-green/5 blur-2xl pointer-events-none" />
        </GlassContainer>
    );
};

export default function Dashboard() {
    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />

            <motion.div
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Welcome Section */}
                <motion.div variants={itemVariants} className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to Admin Control Center</h1>
                    <p className="text-gray-600 dark:text-gray-400">Monitor and manage your platform from a single dashboard</p>
                </motion.div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        title="Total Users"
                        value="2,845"
                        icon={<Users className="h-6 w-6" />}
                        change="12%"
                        positive={true}
                        delay={0.1}
                    />
                    <StatsCard
                        title="Active Groups"
                        value="186"
                        icon={<UserCheck className="h-6 w-6" />}
                        change="8%"
                        positive={true}
                        delay={0.2}
                    />
                    <StatsCard
                        title="System Health"
                        value="94%"
                        icon={<Activity className="h-6 w-6" />}
                        change="2%"
                        positive={false}
                        delay={0.3}
                    />
                    <StatsCard
                        title="Uptime"
                        value="99.8%"
                        icon={<Clock className="h-6 w-6" />}
                        delay={0.4}
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Activity Feed */}
                    <div className="lg:col-span-2">
                        <ActivityCard />
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <QuickActionsCard />
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* System Health */}
                    <div>
                        <SystemHealthCard />
                    </div>

                    {/* Recent Messages */}
                    <motion.div
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
                        variants={itemVariants}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Messages</h3>
                            <a href="/admin/messages" className="text-sm text-[#00887A] dark:text-[#00ccb4] hover:underline flex items-center">
                                View all <ChevronRight className="h-4 w-4 ml-1" />
                            </a>
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-start">
                                    <div className="p-2 rounded-full bg-[#D3E3FC] text-[#00887A] mr-3">
                                        <MessageSquare className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Support Request #{i}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">User reported an issue with login...</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{i * 10} mins ago</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Recent Reports */}
                    <motion.div
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
                        variants={itemVariants}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Reports</h3>
                            <a href="/admin/reports" className="text-sm text-[#00887A] dark:text-[#00ccb4] hover:underline flex items-center">
                                View all <ChevronRight className="h-4 w-4 ml-1" />
                            </a>
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-start">
                                    <div className="p-2 rounded-full bg-[#D3E3FC] text-[#00887A] mr-3">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Monthly Analytics #{i}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">User engagement increased by 15%...</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{i} day{i > 1 ? 's' : ''} ago</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </AdminLayout>
    );
}
