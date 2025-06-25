import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { motion } from 'framer-motion';
import {
    Calendar,
    Download,
    RefreshCw,
    ChevronDown,
    Users,
    MessageSquare,
    CheckSquare,
    Clock
} from 'lucide-react';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
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
    delay?: number;
}

const StatsCard = ({ title, value, icon, change, positive = true, delay = 0 }: StatsCardProps) => {
    return (
        <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
            variants={itemVariants}
            transition={{ delay }}
            whileHover={{
                y: -5,
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                transition: { duration: 0.2 }
            }}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <div className="flex items-baseline mt-1">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
                        {change && (
                            <span className={`ml-2 text-sm font-medium ${positive ? 'text-green-500' : 'text-red-500'}`}>
                                {positive ? '+' : ''}{change}
                            </span>
                        )}
                    </div>
                </div>
                <div className={`p-3 rounded-full ${positive ? 'bg-[#D3E3FC] text-[#00887A]' : 'bg-red-100 text-red-600'}`}>
                    {icon}
                </div>
            </div>
        </motion.div>
    );
};

// Chart Component
interface ChartProps {
    title: string;
    subtitle?: string;
    height?: number;
    children?: React.ReactNode;
}

const Chart = ({ title, subtitle, height = 300, children }: ChartProps) => {
    return (
        <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
            variants={itemVariants}
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                    {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
                </div>
                <div className="flex items-center space-x-2">
                    <button className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                        <Download className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div style={{ height: `${height}px` }} className="relative">
                {children || (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 border-t-[#00887A] dark:border-t-[#00ccb4] rounded-full animate-spin mx-auto"></div>
                            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading chart data...</p>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// User Growth Chart
const UserGrowthChart = () => {
    // This would be replaced with actual chart library in a real implementation
    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 relative">
                {/* Simulated chart bars */}
                <div className="absolute bottom-0 left-0 w-full h-full flex items-end justify-between px-2">
                    {[40, 55, 35, 60, 75, 50, 65, 80, 70, 90, 85, 95].map((height, index) => (
                        <motion.div
                            key={index}
                            className="w-full mx-1 bg-gradient-to-t from-[#00887A] to-[#77A6F7] rounded-t-sm"
                            style={{ height: `${height}%` }}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                        />
                    ))}
                </div>
            </div>
            <div className="h-8 mt-2 flex justify-between px-2">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                    <div key={index} className="text-xs text-gray-500 dark:text-gray-400">
                        {month}
                    </div>
                ))}
            </div>
        </div>
    );
};

// Feature Usage Chart
const FeatureUsageChart = () => {
    // This would be replaced with actual chart library in a real implementation
    const features = [
        { name: 'Chat', value: 85 },
        { name: 'Tasks', value: 65 },
        { name: 'Groups', value: 75 },
        { name: 'Calendar', value: 45 },
        { name: 'AI Tasks', value: 55 },
    ];

    return (
        <div className="w-full h-full flex flex-col space-y-4 pt-4">
            {features.map((feature, index) => (
                <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{feature.name}</span>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{feature.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <motion.div
                            className="h-2.5 rounded-full bg-[#77A6F7]"
                            initial={{ width: 0 }}
                            animate={{ width: `${feature.value}%` }}
                            transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

// User Activity Chart
const UserActivityChart = () => {
    // This would be replaced with actual chart library in a real implementation
    return (
        <div className="w-full h-full flex items-end justify-between px-2">
            {[40, 30, 45, 70, 65, 90, 80].map((height, index) => (
                <div key={index} className="flex flex-col items-center">
                    <motion.div
                        className="w-8 bg-[#D3E3FC] dark:bg-[#1e3a60] rounded-t-sm"
                        style={{ height: `${height}%` }}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                    >
                        <div
                            className="w-full h-full bg-gradient-to-b from-[#77A6F7] to-[#00887A] opacity-80 rounded-t-sm"
                        />
                    </motion.div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Device Distribution Chart
const DeviceDistributionChart = () => {
    // This would be replaced with actual chart library in a real implementation
    const devices = [
        { name: 'Desktop', value: 65, color: '#00887A' },
        { name: 'Mobile', value: 25, color: '#77A6F7' },
        { name: 'Tablet', value: 10, color: '#FFCCBC' },
    ];

    let startAngle = 0;

    return (
        <div className="w-full h-full flex justify-center items-center">
            <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    {devices.map((device, index) => {
                        const angle = (device.value / 100) * 360;
                        const endAngle = startAngle + angle;

                        // Calculate the path for the pie slice
                        const x1 = 50 + 40 * Math.cos((Math.PI * startAngle) / 180);
                        const y1 = 50 + 40 * Math.sin((Math.PI * startAngle) / 180);
                        const x2 = 50 + 40 * Math.cos((Math.PI * endAngle) / 180);
                        const y2 = 50 + 40 * Math.sin((Math.PI * endAngle) / 180);

                        // Determine if the slice is more than 180 degrees
                        const largeArcFlag = angle > 180 ? 1 : 0;

                        // Create the path
                        const path = `
                            M 50 50
                            L ${x1} ${y1}
                            A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}
                            Z
                        `;

                        const currentStartAngle = startAngle;
                        startAngle = endAngle;

                        return (
                            <motion.path
                                key={index}
                                d={path}
                                fill={device.color}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5, delay: index * 0.2 }}
                            />
                        );
                    })}
                    <circle cx="50" cy="50" r="25" fill="white" className="dark:fill-gray-800" />
                </svg>

                <div className="absolute inset-0 flex items-center justify-center text-center">
                    <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">65%</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Desktop</div>
                    </div>
                </div>
            </div>

            <div className="ml-8 space-y-4">
                {devices.map((device, index) => (
                    <div key={index} className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: device.color }}></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{device.name}</span>
                        <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">{device.value}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function AnalyticsIndex() {
    const [timeRange, setTimeRange] = useState('30d');

    return (
        <AdminLayout>
            <Head title="Analytics Dashboard" />

            <motion.div
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
                        <p className="text-gray-600 dark:text-gray-400">Monitor platform performance and user engagement</p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                <Calendar className="h-4 w-4 mr-2" />
                                {timeRange === '7d' && 'Last 7 days'}
                                {timeRange === '30d' && 'Last 30 days'}
                                {timeRange === '90d' && 'Last 90 days'}
                                {timeRange === '12m' && 'Last 12 months'}
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </button>

                            {/* Dropdown would go here */}
                        </div>

                        <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <Download className="h-4 w-4" />
                        </button>

                        <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <RefreshCw className="h-4 w-4" />
                        </button>
                    </div>
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
                        icon={<Users className="h-6 w-6" />}
                        change="8%"
                        positive={true}
                        delay={0.2}
                    />
                    <StatsCard
                        title="Messages Sent"
                        value="24,521"
                        icon={<MessageSquare className="h-6 w-6" />}
                        change="15%"
                        positive={true}
                        delay={0.3}
                    />
                    <StatsCard
                        title="Tasks Completed"
                        value="1,842"
                        icon={<CheckSquare className="h-6 w-6" />}
                        change="5%"
                        positive={true}
                        delay={0.4}
                    />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Chart
                        title="User Growth"
                        subtitle="New users over time"
                        height={350}
                    >
                        <UserGrowthChart />
                    </Chart>

                    <Chart
                        title="Feature Usage"
                        subtitle="Most used platform features"
                        height={350}
                    >
                        <FeatureUsageChart />
                    </Chart>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Chart
                        title="User Activity"
                        subtitle="Daily active users"
                        height={300}
                    >
                        <UserActivityChart />
                    </Chart>

                    <Chart
                        title="Device Distribution"
                        subtitle="User devices breakdown"
                        height={300}
                    >
                        <DeviceDistributionChart />
                    </Chart>
                </div>

                {/* Engagement Metrics */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
                >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Engagement Metrics</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Avg. Session Duration</span>
                                <span className="flex items-center text-green-500 text-xs font-medium">
                                    +12%
                                </span>
                            </div>
                            <div className="flex items-center">
                                <Clock className="h-5 w-5 text-[#00887A] mr-2" />
                                <span className="text-xl font-bold text-gray-900 dark:text-white">12m 48s</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Pages per Session</span>
                                <span className="flex items-center text-green-500 text-xs font-medium">
                                    +8%
                                </span>
                            </div>
                            <div className="flex items-center">
                                <div className="h-5 w-5 text-[#00887A] mr-2 flex items-center justify-center">
                                    <span className="font-bold">P</span>
                                </div>
                                <span className="text-xl font-bold text-gray-900 dark:text-white">5.2</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Bounce Rate</span>
                                <span className="flex items-center text-red-500 text-xs font-medium">
                                    +3%
                                </span>
                            </div>
                            <div className="flex items-center">
                                <div className="h-5 w-5 text-[#00887A] mr-2 flex items-center justify-center">
                                    <span className="font-bold">B</span>
                                </div>
                                <span className="text-xl font-bold text-gray-900 dark:text-white">32%</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Conversion Rate</span>
                                <span className="flex items-center text-green-500 text-xs font-medium">
                                    +5%
                                </span>
                            </div>
                            <div className="flex items-center">
                                <div className="h-5 w-5 text-[#00887A] mr-2 flex items-center justify-center">
                                    <span className="font-bold">C</span>
                                </div>
                                <span className="text-xl font-bold text-gray-900 dark:text-white">8.4%</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AdminLayout>
    );
}
