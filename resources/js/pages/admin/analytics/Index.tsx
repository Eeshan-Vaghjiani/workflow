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

// Define types for the data
interface Stats {
    users: number;
    groups: number;
    messages: number;
    tasks: number;
}

interface FeatureUsage {
    name: string;
    value: number;
}

interface DeviceDistribution {
    name: string;
    value: number;
    color: string;
}

interface AnalyticsProps {
    stats: Stats;
    userGrowth: number[];
    featureUsage: FeatureUsage[];
    dailyActivity: number[];
    deviceDistribution: DeviceDistribution[];
}

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
            type: "spring" as const,
            stiffness: 100,
            damping: 15
        }
    }
};

// 3D Card effect component
const Card3D: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = "", children }) => {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [glowPosition, setGlowPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate rotation based on mouse position
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateXValue = ((y - centerY) / centerY) * 5; // Limit rotation to 5 degrees
        const rotateYValue = ((centerX - x) / centerX) * 5;

        // Update glow position
        const glowX = (x / rect.width) * 100;
        const glowY = (y / rect.height) * 100;

        setRotateX(rotateXValue);
        setRotateY(rotateYValue);
        setGlowPosition({ x: glowX, y: glowY });
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
    };

    return (
        <div
            className={`relative rounded-xl shadow-sm overflow-hidden ${className}`}
            style={{
                transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                transition: "transform 0.3s ease",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Highlight/glow effect */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, rgba(255,255,255,0.2) 0%, transparent 50%)`,
                    opacity: Math.abs(rotateX) + Math.abs(rotateY) > 0 ? 1 : 0,
                    transition: "opacity 0.3s ease"
                }}
            />

            {/* Border highlight */}
            <div
                className="absolute inset-0 border border-white/10 rounded-xl pointer-events-none"
                style={{
                    boxShadow: `0 0 15px 1px rgba(255,255,255,${(Math.abs(rotateX) + Math.abs(rotateY)) / 20})`,
                    opacity: Math.abs(rotateX) + Math.abs(rotateY) > 0 ? 1 : 0,
                    transition: "opacity 0.3s ease"
                }}
            />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
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
        <motion.div variants={itemVariants} transition={{ delay }}>
            <Card3D className="bg-white dark:bg-gray-800 p-6 border border-gray-100 dark:border-gray-700">
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
                    <div className={`p-3 rounded-full ${positive ? 'bg-[#D3E3FC] text-[#00887A] dark:bg-[#1e3a60] dark:text-[#00ccb4]' : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                        {icon}
                    </div>
                </div>
            </Card3D>
        </motion.div>
    );
};

// Chart Component
interface ChartProps {
    title: string;
    subtitle?: string;
    height?: number;
    children?: React.ReactNode;
    onDownload?: () => void;
}

const Chart = ({ title, subtitle, height = 300, children, onDownload }: ChartProps) => {
    return (
        <motion.div variants={itemVariants}>
            <Card3D className="bg-white dark:bg-gray-800 p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
                    </div>
                    <div className="flex items-center space-x-2">
                        {onDownload && (
                            <button
                                onClick={onDownload}
                                className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                            >
                                <Download className="h-4 w-4" />
                            </button>
                        )}
                        <button className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
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
            </Card3D>
        </motion.div>
    );
};

// User Growth Chart
const UserGrowthChart = ({ data }: { data: number[] }) => {
    const downloadChart = () => {
        // Create CSV content
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        let csvContent = "Month,User Count\n";
        data.forEach((value, index) => {
            csvContent += `${months[index]},${value}\n`;
        });

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'user_growth_data.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // This would be replaced with actual chart library in a real implementation
    return (
        <Chart title="User Growth" subtitle="Monthly registrations over time" onDownload={downloadChart}>
            <div className="w-full h-full flex flex-col">
                <div className="flex-1 relative">
                    {/* Simulated chart bars */}
                    <div className="absolute bottom-0 left-0 w-full h-full flex items-end justify-between px-2">
                        {data.map((height, index) => {
                            // Normalize height percentage
                            const maxValue = Math.max(...data);
                            const heightPercentage = maxValue > 0 ? (height / maxValue) * 100 : 0;

                            return (
                                <motion.div
                                    key={index}
                                    className="w-full mx-1 bg-gradient-to-t from-[#00887A] to-[#77A6F7] rounded-t-sm"
                                    style={{ height: `${heightPercentage}%` }}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${heightPercentage}%` }}
                                    transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                                />
                            );
                        })}
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
        </Chart>
    );
};

// Feature Usage Chart
const FeatureUsageChart = ({ data }: { data: FeatureUsage[] }) => {
    const downloadChart = () => {
        // Create CSV content
        let csvContent = "Feature,Usage Percentage\n";
        data.forEach(item => {
            csvContent += `${item.name},${item.value}%\n`;
        });

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'feature_usage_data.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Chart title="Feature Usage" subtitle="Per user activity" onDownload={downloadChart}>
            <div className="w-full h-full flex flex-col space-y-4 pt-4">
                {data.map((feature, index) => (
                    <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{feature.name}</span>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{feature.value}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <motion.div
                                className="h-2.5 rounded-full bg-[#77A6F7] dark:bg-[#00ccb4]"
                                initial={{ width: 0 }}
                                animate={{ width: `${feature.value}%` }}
                                transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </Chart>
    );
};

// User Activity Chart
const UserActivityChart = ({ data }: { data: number[] }) => {
    const downloadChart = () => {
        // Create CSV content
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        let csvContent = "Day,Activity Percentage\n";
        data.forEach((value, index) => {
            csvContent += `${days[index]},${value}%\n`;
        });

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'user_activity_data.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Chart title="User Activity" subtitle="Daily active users" onDownload={downloadChart}>
            <div className="w-full h-full flex items-end justify-between px-2">
                {data.map((height, index) => (
                    <div key={index} className="flex flex-col items-center">
                        <motion.div
                            className="w-8 bg-[#D3E3FC] dark:bg-[#1e3a60] rounded-t-sm"
                            style={{ height: `${height}%` }}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                        >
                            <div
                                className="w-full h-full bg-gradient-to-b from-[#77A6F7] to-[#00887A] opacity-80 dark:from-[#00ccb4] dark:to-[#00887A] rounded-t-sm"
                            />
                        </motion.div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                        </div>
                    </div>
                ))}
            </div>
        </Chart>
    );
};

// Device Distribution Chart
const DeviceDistributionChart = ({ data }: { data: DeviceDistribution[] }) => {
    const downloadChart = () => {
        // Create CSV content
        let csvContent = "Device,Percentage\n";
        data.forEach(item => {
            csvContent += `${item.name},${item.value}%\n`;
        });

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'device_distribution_data.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    let startAngle = 0;

    return (
        <Chart title="Device Distribution" subtitle="User devices" onDownload={downloadChart}>
            <div className="w-full h-full flex justify-center items-center">
                <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                        {data.map((device, index) => {
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

                            // Update the start angle for the next slice
                            const oldStartAngle = startAngle;
                            startAngle = endAngle;

                            return (
                                <motion.path
                                    key={index}
                                    d={path}
                                    fill={device.color}
                                    stroke="#fff"
                                    strokeWidth="1"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5, delay: index * 0.2 }}
                                />
                            );
                        })}
                    </svg>

                    {/* Legend */}
                    <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                        <div className="flex flex-wrap justify-center gap-4">
                            {data.map((device, index) => (
                                <div key={index} className="flex items-center">
                                    <div
                                        className="w-3 h-3 rounded-full mr-1"
                                        style={{ backgroundColor: device.color }}
                                    />
                                    <span className="text-xs text-gray-600 dark:text-gray-300">
                                        {device.name} ({device.value}%)
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Chart>
    );
};

export default function AnalyticsIndex({ stats, userGrowth, featureUsage, dailyActivity, deviceDistribution }: AnalyticsProps) {
    // Format the stats to include percentage changes
    const formattedStats = {
        users: {
            value: stats.users,
            change: "+12%", // This would ideally be calculated from historical data
        },
        groups: {
            value: stats.groups,
            change: "+8%",
        },
        messages: {
            value: stats.messages,
            change: "+23%",
        },
        tasks: {
            value: stats.tasks,
            change: "+15%",
        }
    };

    return (
        <AdminLayout>
            <Head title="Analytics Dashboard" />

            <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400">View detailed insights and metrics</p>
            </motion.div>

            <motion.div
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        title="Total Users"
                        value={formattedStats.users.value}
                        change={formattedStats.users.change}
                        icon={<Users className="h-5 w-5" />}
                        delay={0}
                    />
                    <StatsCard
                        title="Total Groups"
                        value={formattedStats.groups.value}
                        change={formattedStats.groups.change}
                        icon={<Users className="h-5 w-5" />}
                        delay={0.1}
                    />
                    <StatsCard
                        title="Total Messages"
                        value={formattedStats.messages.value}
                        change={formattedStats.messages.change}
                        icon={<MessageSquare className="h-5 w-5" />}
                        delay={0.2}
                    />
                    <StatsCard
                        title="Total Tasks"
                        value={formattedStats.tasks.value}
                        change={formattedStats.tasks.change}
                        icon={<CheckSquare className="h-5 w-5" />}
                        delay={0.3}
                    />
                </div>

                {/* Main Chart */}
                <UserGrowthChart data={userGrowth} />

                {/* Secondary Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FeatureUsageChart data={featureUsage} />
                    <UserActivityChart data={dailyActivity} />
                </div>

                {/* Device Distribution */}
                <DeviceDistributionChart data={deviceDistribution} />
            </motion.div>
        </AdminLayout>
    );
}
