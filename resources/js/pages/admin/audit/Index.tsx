import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { motion } from 'framer-motion';
import {
    Search,
    Filter,
    Download,
    RefreshCw,
    ChevronDown,
    CheckCircle,
    AlertCircle,
    XCircle,
    Calendar,
    Clock,
    User,
    Settings,
    Shield,
    FileText,
    Trash,
    Edit,
    Plus,
    LogIn,
    LogOut,
    Key
} from 'lucide-react';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};

// Mock audit log data
const auditLogs = [
    {
        id: 1,
        user: 'John Doe',
        action: 'User Login',
        details: 'Successful login from 192.168.1.1',
        timestamp: '2024-06-15 09:23:45',
        category: 'auth',
        status: 'success',
        icon: LogIn
    },
    {
        id: 2,
        user: 'Sarah Smith',
        action: 'User Created',
        details: 'New user account created for sarah@example.com',
        timestamp: '2024-06-15 10:15:22',
        category: 'user',
        status: 'success',
        icon: Plus
    },
    {
        id: 3,
        user: 'Admin',
        action: 'Settings Updated',
        details: 'System notification settings were modified',
        timestamp: '2024-06-15 11:05:17',
        category: 'settings',
        status: 'success',
        icon: Settings
    },
    {
        id: 4,
        user: 'Michael Johnson',
        action: 'Failed Login',
        details: 'Failed login attempt from 203.0.113.1',
        timestamp: '2024-06-15 11:32:08',
        category: 'auth',
        status: 'error',
        icon: XCircle
    },
    {
        id: 5,
        user: 'Emily Brown',
        action: 'User Updated',
        details: 'Profile information updated',
        timestamp: '2024-06-15 12:45:33',
        category: 'user',
        status: 'success',
        icon: Edit
    },
    {
        id: 6,
        user: 'David Wilson',
        action: 'Group Created',
        details: 'New group "Marketing Team" created',
        timestamp: '2024-06-15 13:17:29',
        category: 'group',
        status: 'success',
        icon: Plus
    },
    {
        id: 7,
        user: 'Admin',
        action: 'User Deleted',
        details: 'User account for test@example.com was deleted',
        timestamp: '2024-06-15 14:22:51',
        category: 'user',
        status: 'warning',
        icon: Trash
    },
    {
        id: 8,
        user: 'Jessica Taylor',
        action: 'Password Reset',
        details: 'Password reset requested',
        timestamp: '2024-06-15 15:10:05',
        category: 'auth',
        status: 'success',
        icon: Key
    },
    {
        id: 9,
        user: 'Daniel Martinez',
        action: 'Permission Changed',
        details: 'User role changed from USER to ADMIN',
        timestamp: '2024-06-15 16:05:42',
        category: 'user',
        status: 'warning',
        icon: Shield
    },
    {
        id: 10,
        user: 'Sophia Anderson',
        action: 'User Logout',
        details: 'User logged out',
        timestamp: '2024-06-15 17:30:19',
        category: 'auth',
        status: 'success',
        icon: LogOut
    },
    {
        id: 11,
        user: 'Admin',
        action: 'Backup Created',
        details: 'System backup created successfully',
        timestamp: '2024-06-15 18:00:00',
        category: 'system',
        status: 'success',
        icon: FileText
    },
    {
        id: 12,
        user: 'Matthew Thomas',
        action: 'API Access',
        details: 'Unauthorized API access attempt',
        timestamp: '2024-06-15 19:12:37',
        category: 'api',
        status: 'error',
        icon: AlertCircle
    }
];

export default function AuditIndex() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [timeRange, setTimeRange] = useState('24h');

    // Handle search
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // Filter logs
    const filteredLogs = auditLogs
        .filter(log =>
            (log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.details.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (selectedCategory === 'all' || log.category === selectedCategory) &&
            (selectedStatus === 'all' || log.status === selectedStatus)
        );

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
                return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
            case 'warning':
                return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'error':
                return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
        }
    };

    // Get category color
    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'auth':
                return 'bg-[#D3E3FC]/50 text-[#77A6F7] dark:bg-[#1e3a60]/50 dark:text-[#77A6F7]';
            case 'user':
                return 'bg-[#FFCCBC]/50 text-[#FF8A65] dark:bg-[#4d2e24]/50 dark:text-[#FFCCBC]';
            case 'settings':
                return 'bg-[#00887A]/20 text-[#00887A] dark:bg-[#00887A]/30 dark:text-[#00ccb4]';
            case 'group':
                return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
            case 'system':
                return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
            case 'api':
                return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
            default:
                return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
        }
    };

    return (
        <AdminLayout>
            <Head title="Audit Logs" />

            <motion.div
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
                        <p className="text-gray-600 dark:text-gray-400">Track system activity and user actions</p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                <Calendar className="h-4 w-4 mr-2" />
                                {timeRange === '24h' && 'Last 24 hours'}
                                {timeRange === '7d' && 'Last 7 days'}
                                {timeRange === '30d' && 'Last 30 days'}
                                {timeRange === 'custom' && 'Custom Range'}
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

                {/* Filters and Search */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="search"
                            className="block w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-[#00887A] focus:border-[#00887A] dark:focus:ring-[#00ccb4] dark:focus:border-[#00ccb4]"
                            placeholder="Search logs..."
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="appearance-none pl-3 pr-8 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-[#00887A] dark:focus:ring-[#00ccb4]"
                            >
                                <option value="all">All Categories</option>
                                <option value="auth">Authentication</option>
                                <option value="user">User Management</option>
                                <option value="group">Groups</option>
                                <option value="settings">Settings</option>
                                <option value="system">System</option>
                                <option value="api">API</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                            </div>
                        </div>

                        <div className="relative">
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="appearance-none pl-3 pr-8 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-[#00887A] dark:focus:ring-[#00ccb4]"
                            >
                                <option value="all">All Status</option>
                                <option value="success">Success</option>
                                <option value="warning">Warning</option>
                                <option value="error">Error</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                            </div>
                        </div>

                        <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                            <Filter className="h-4 w-4 mr-2" />
                            More Filters
                        </button>
                    </div>
                </motion.div>

                {/* Audit Logs */}
                <motion.div variants={itemVariants} className="space-y-4">
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map((log, index) => {
                            const IconComponent = log.icon;

                            return (
                                <motion.div
                                    key={log.id}
                                    className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-start"
                                    variants={itemVariants}
                                    custom={index}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{
                                        backgroundColor: 'rgba(211, 227, 252, 0.1)',
                                        transition: { duration: 0.2 }
                                    }}
                                >
                                    <div className={`p-2 rounded-full mr-4 ${getStatusColor(log.status)}`}>
                                        <IconComponent className="h-5 w-5" />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <h3 className="text-base font-medium text-gray-900 dark:text-white">{log.action}</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{log.details}</p>
                                            </div>

                                            <div className="flex items-center mt-2 md:mt-0">
                                                <span className={`text-xs font-medium px-2 py-1 rounded-full mr-2 ${getCategoryColor(log.category)}`}>
                                                    {log.category.charAt(0).toUpperCase() + log.category.slice(1)}
                                                </span>
                                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(log.status)}`}>
                                                    {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center mr-4">
                                                <User className="h-4 w-4 mr-1" />
                                                {log.user}
                                            </div>
                                            <div className="flex items-center">
                                                <Clock className="h-4 w-4 mr-1" />
                                                {log.timestamp}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No logs found</h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                No audit logs match your current filters. Try adjusting your search or filters.
                            </p>
                        </div>
                    )}
                </motion.div>

                {/* Pagination */}
                {filteredLogs.length > 0 && (
                    <motion.div
                        variants={itemVariants}
                        className="flex items-center justify-between"
                    >
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Showing <span className="font-medium">{filteredLogs.length}</span> of <span className="font-medium">{auditLogs.length}</span> logs
                        </div>

                        <div className="flex items-center space-x-2">
                            <button className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                Previous
                            </button>
                            <button className="px-3 py-1 text-sm font-medium text-white bg-[#00887A] hover:bg-[#007A6C] rounded-md transition-colors">
                                Next
                            </button>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </AdminLayout>
    );
}
