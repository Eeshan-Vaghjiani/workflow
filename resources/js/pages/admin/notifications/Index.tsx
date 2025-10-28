import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { motion } from 'framer-motion';
import {
    Bell,
    CheckCircle,
    AlertTriangle,
    Info,
    X,
    Filter,
    RefreshCw,
    User
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
            type: "spring" as const,
            stiffness: 100,
            damping: 15
        }
    }
};

// Define types for database notifications
interface NotificationUser {
    id: number;
    name: string;
    email: string;
}

interface NotificationData {
    id: number;
    user_id: number;
    type: string;
    data: {
        title?: string;
        message?: string;
        group_id?: number;
        task_id?: number;
        [key: string]: string | number | boolean | null | undefined;
    };
    read: boolean;
    created_at: string;
    updated_at: string;
    user: NotificationUser;
}

interface NotificationsProps {
    notifications: {
        data: NotificationData[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

// Notification type filter options
const filterOptions = [
    { value: 'all', label: 'All Notifications' },
    { value: 'task_assignment', label: 'Task Assignments' },
    { value: 'deadline_reminder', label: 'Deadline Reminders' },
    { value: 'group_invitation', label: 'Group Invitations' },
    { value: 'unread', label: 'Unread' },
];

export default function Notifications({ notifications }: NotificationsProps) {
    const [activeFilter, setActiveFilter] = useState('all');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Filter notifications based on the active filter
    const filteredNotifications = notifications.data.filter(notification => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'unread') return !notification.read;
        return notification.type === activeFilter;
    });

    // Handle marking a notification as read
    const markAsRead = (id: number) => {
        router.post(route('admin.notifications.mark-as-read', { id }), {}, {
            preserveScroll: true,
            onSuccess: () => {
                // Flash message or other feedback could be added here
            }
        });
    };

    // Handle dismissing a notification
    const dismissNotification = (id: number) => {
        if (confirm('Are you sure you want to delete this notification?')) {
            router.delete(route('admin.notifications.delete', { id }), {
                onSuccess: () => {
                    // The page will refresh with updated data
                }
            });
        }
    };

    // Handle marking all as read
    const markAllAsRead = () => {
        router.post(route('admin.notifications.mark-all-as-read'), {}, {
            preserveScroll: true,
            onSuccess: () => {
                // Flash message or other feedback could be added here
            }
        });
    };

    // Handle filter change
    const handleFilterChange = (filter: string) => {
        setActiveFilter(filter);
        setDropdownOpen(false);
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            if (diffHours === 0) {
                const diffMinutes = Math.floor(diffTime / (1000 * 60));
                return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
            }
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        }

        return date.toLocaleDateString();
    };

    // Get notification icon based on type
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'task_assignment':
                return <CheckCircle className="h-5 w-5" />;
            case 'deadline_reminder':
                return <AlertTriangle className="h-5 w-5" />;
            case 'group_invitation':
                return <User className="h-5 w-5" />;
            default:
                return <Info className="h-5 w-5" />;
        }
    };

    // Get notification color based on type
    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'task_assignment':
                return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400';
            case 'deadline_reminder':
                return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'group_invitation':
                return 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
            default:
                return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
        }
    };

    // Get notification title
    const getNotificationTitle = (notification: NotificationData) => {
        return notification.data.title || typeToTitle(notification.type);
    };

    // Convert notification type to title
    const typeToTitle = (type: string) => {
        switch (type) {
            case 'task_assignment':
                return 'Task Assignment';
            case 'deadline_reminder':
                return 'Deadline Reminder';
            case 'group_invitation':
                return 'Group Invitation';
            default:
                return 'Notification';
        }
    };

    // Handle pagination
    const goToPage = (page: number) => {
        router.get(route('admin.notifications.index', { page }));
    };

    return (
        <AdminLayout>
            <Head title="Admin Notifications" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                <p className="text-gray-500 dark:text-gray-400">View and manage system notifications</p>
            </div>

            <motion.div
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Actions bar */}
                <motion.div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4"
                    variants={itemVariants}
                >
                    {/* Filter dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            <span>
                                {filterOptions.find(option => option.value === activeFilter)?.label || 'Filter'}
                            </span>
                        </button>

                        {dropdownOpen && (
                            <div className="absolute z-10 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
                                <div className="py-1">
                                    {filterOptions.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleFilterChange(option.value)}
                                            className={`flex items-center w-full text-left px-4 py-2 text-sm ${activeFilter === option.value
                                                ? 'bg-gray-100 dark:bg-gray-700 text-[#00887A] dark:text-[#00ccb4]'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark all as read
                        </button>
                    </div>
                </motion.div>

                {/* Notifications list */}
                <motion.div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700"
                    variants={itemVariants}
                >
                    {filteredNotifications.length > 0 ? (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredNotifications.map((notification) => (
                                <motion.li
                                    key={notification.id}
                                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                                        }`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    whileHover={{ x: 5 }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-3">
                                            <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                                                {getNotificationIcon(notification.type)}
                                            </div>

                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {getNotificationTitle(notification)}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    {notification.data.message || `Notification for ${notification.user.name}`}
                                                </p>
                                                <div className="flex items-center mt-2">
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                                        {formatDate(notification.created_at)}
                                                    </p>
                                                    <div className="mx-2 w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                                        {notification.user.name}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {!notification.read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="text-sm text-[#00887A] dark:text-[#00ccb4] hover:underline"
                                                >
                                                    Mark as read
                                                </button>
                                            )}

                                            <button
                                                onClick={() => dismissNotification(notification.id)}
                                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                                <Bell className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                                No notifications
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {activeFilter === 'all'
                                    ? 'You have no notifications at the moment.'
                                    : `You have no ${activeFilter === 'unread' ? 'unread' : activeFilter} notifications.`}
                            </p>
                            <button
                                onClick={() => setActiveFilter('all')}
                                className="mt-4 flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* Pagination */}
                {filteredNotifications.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Showing <span className="font-medium">{(notifications.current_page - 1) * notifications.per_page + 1}</span> to{' '}
                                <span className="font-medium">
                                    {Math.min(notifications.current_page * notifications.per_page, notifications.total)}
                                </span> of{' '}
                                <span className="font-medium">{notifications.total}</span> notifications
                            </p>
                        </div>

                        <div className="flex space-x-1">
                            <button
                                onClick={() => goToPage(notifications.current_page - 1)}
                                disabled={notifications.current_page === 1}
                                className={`px-3 py-1 rounded-md ${notifications.current_page === 1
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                Previous
                            </button>

                            {[...Array(notifications.last_page)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => goToPage(i + 1)}
                                    className={`px-3 py-1 rounded-md ${notifications.current_page === i + 1
                                        ? 'bg-[#00887A] text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => goToPage(notifications.current_page + 1)}
                                disabled={notifications.current_page === notifications.last_page}
                                className={`px-3 py-1 rounded-md ${notifications.current_page === notifications.last_page
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </AdminLayout>
    );
}
