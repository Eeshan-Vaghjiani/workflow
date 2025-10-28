import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Bell, Calendar, CheckCircle, Users, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import axios from 'axios';
import { Card3D } from '@/components/ui/card-3d';
import { GlassContainer } from '@/components/ui/glass-container';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { containerVariants, itemVariants } from '@/lib/theme-constants';

interface NotificationData {
    group_id?: number;
    group_name?: string;
    inviter_id?: number;
    inviter_name?: string;
    assignment_id?: number;
    assignment_title?: string;
    due_date?: string;
    creator_id?: number;
    creator_name?: string;
    sender_id?: number;
    sender_name?: string;
    content?: string;
    task_id?: number;
    task_title?: string;
    requester_id?: number;
    requester_name?: string;
    approver_id?: number;
    approver_name?: string;
    assigner_name?: string;
}

interface Notification {
    id: number;
    type: 'group_invitation' | 'assignment_due' | 'assignment_created' | 'direct_message' | 'group_message' | 'task_assignment' | 'deadline_reminder' | 'group_join_request' | 'group_join_approved';
    data: NotificationData;
    read: boolean;
    created_at: string;
}

interface Props {
    notifications: Notification[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Notifications',
        href: '/notifications',
    },
];

export default function NotificationsIndex({ notifications }: Props) {
    const [notificationsList, setNotificationsList] = useState<Notification[]>(notifications);

    const markAsRead = async (notificationId: number) => {
        try {
            await axios.post(route('notifications.mark-as-read', notificationId));
            setNotificationsList(prev =>
                prev.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, read: true }
                        : notification
                )
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.post(route('notifications.mark-all-as-read'));
            setNotificationsList(prev =>
                prev.map(notification => ({ ...notification, read: true }))
            );
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'group_invitation':
                return <Users className="h-6 w-6 text-primary-500 dark:text-neon-blue" />;
            case 'assignment_due':
                return <Calendar className="h-6 w-6 text-red-500 dark:text-red-400" />;
            case 'assignment_created':
                return <Calendar className="h-6 w-6 text-green-500 dark:text-neon-green" />;
            case 'direct_message':
            case 'group_message':
                return <MessageSquare className="h-6 w-6 text-purple-500 dark:text-purple-400" />;
            case 'task_assignment':
            case 'deadline_reminder':
                return <CheckCircle className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />;
            case 'group_join_request':
            case 'group_join_approved':
                return <Users className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />;
            default:
                return <Bell className="h-6 w-6 text-gray-500 dark:text-gray-400" />;
        }
    };

    // Helper function to get notification content
    const getNotificationContent = (notification: Notification) => {
        const { type, data } = notification;

        switch (type) {
            case 'group_invitation':
                return (
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Group Invitation</p>
                        <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">{data.inviter_name}</span> invited you to join the group <span className="font-medium">{data.group_name}</span>
                        </p>
                        <div className="mt-2">
                            <Link
                                href={route('groups.show', data.group_id)}
                                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                                View Group
                            </Link>
                        </div>
                    </div>
                );
            case 'assignment_due':
                return (
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Assignment Due Soon</p>
                        <p className="text-gray-600 dark:text-gray-300">
                            Assignment <span className="font-medium">{data.assignment_title}</span> in group <span className="font-medium">{data.group_name}</span> is due on <span className="font-medium">{new Date(data.due_date!).toLocaleDateString()}</span>
                        </p>
                        <div className="mt-2">
                            <Link
                                href={route('group-assignments.show', { group: data.group_id, assignment: data.assignment_id })}
                                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                                View Assignment
                            </Link>
                        </div>
                    </div>
                );
            case 'assignment_created':
                return (
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">New Assignment</p>
                        <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">{data.creator_name}</span> created a new assignment <span className="font-medium">{data.assignment_title}</span> in group <span className="font-medium">{data.group_name}</span>
                        </p>
                        <div className="mt-2">
                            <Link
                                href={route('group-assignments.show', { group: data.group_id, assignment: data.assignment_id })}
                                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                                View Assignment
                            </Link>
                        </div>
                    </div>
                );
            case 'direct_message':
                return (
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">New Direct Message</p>
                        <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">{data.sender_name}</span> sent you a message: <span className="font-medium">{data.content}</span>
                        </p>
                        <div className="mt-2">
                            <Link
                                href={route('chat.direct', data.sender_id)}
                                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                                View Message
                            </Link>
                        </div>
                    </div>
                );
            case 'group_message':
                return (
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">New Group Message</p>
                        <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">{data.sender_name}</span> sent a message in <span className="font-medium">{data.group_name}</span>: <span className="font-medium">{data.content}</span>
                        </p>
                        <div className="mt-2">
                            <Link
                                href={route('chat.group', data.group_id)}
                                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                                View Message
                            </Link>
                        </div>
                    </div>
                );
            case 'task_assignment':
                return (
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">New Task Assignment</p>
                        <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">{data.assigner_name}</span> assigned you a task <span className="font-medium">{data.task_title}</span> in <span className="font-medium">{data.group_name}</span>
                        </p>
                        <div className="mt-2">
                            <Link
                                href={route('group-tasks.show', { group: data.group_id, task: data.task_id })}
                                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                                View Task
                            </Link>
                        </div>
                    </div>
                );
            case 'deadline_reminder':
                return (
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Task Deadline Reminder</p>
                        <p className="text-gray-600 dark:text-gray-300">
                            Task <span className="font-medium">{data.task_title}</span> in <span className="font-medium">{data.group_name}</span> is due soon
                        </p>
                        <div className="mt-2">
                            <Link
                                href={route('group-tasks.show', { group: data.group_id, task: data.task_id })}
                                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                                View Task
                            </Link>
                        </div>
                    </div>
                );
            case 'group_join_request':
                return (
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Group Join Request</p>
                        <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">{data.requester_name}</span> requested to join <span className="font-medium">{data.group_name}</span>
                        </p>
                        <div className="mt-2">
                            <Link
                                href={route('groups.members.index', data.group_id)}
                                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                                View Request
                            </Link>
                        </div>
                    </div>
                );
            case 'group_join_approved':
                return (
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Join Request Approved</p>
                        <p className="text-gray-600 dark:text-gray-300">
                            Your request to join <span className="font-medium">{data.group_name}</span> was approved by <span className="font-medium">{data.approver_name}</span>
                        </p>
                        <div className="mt-2">
                            <Link
                                href={route('groups.show', data.group_id)}
                                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                                View Group
                            </Link>
                        </div>
                    </div>
                );
            default:
                return <p>Unknown notification type</p>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications" />
            <motion.div
                className="flex h-full flex-1 flex-col gap-6 p-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants}>
                    <Card3D className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>

                            {notificationsList.some(n => !n.read) && (
                                <EnhancedButton
                                    onClick={markAllAsRead}
                                    variant="outline"
                                    size="sm"
                                    magnetic={true}
                                >
                                    Mark All as Read
                                </EnhancedButton>
                            )}
                        </div>

                        {notificationsList.length === 0 ? (
                            <motion.div
                                className="text-center py-12"
                                animate={{
                                    scale: [1, 1.05, 1],
                                    transition: { duration: 3, repeat: Infinity }
                                }}
                            >
                                <Bell className="mx-auto h-14 w-14 text-gray-400 dark:text-gray-600 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400 text-lg">No notifications yet</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                className="space-y-5"
                                variants={containerVariants}
                            >
                                {notificationsList.map((notification, index) => (
                                    <motion.div
                                        key={notification.id}
                                        variants={itemVariants}
                                        custom={index}
                                    >
                                        <GlassContainer
                                            className={`p-4 ${!notification.read ? 'border-l-4 border-l-primary-500 dark:border-l-neon-blue' : ''}`}
                                            blurIntensity={notification.read ? "sm" : "md"}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="flex-shrink-0 p-2 rounded-full bg-gray-100/80 dark:bg-gray-800/80">
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="flex-grow">
                                                    {getNotificationContent(notification)}
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                        {new Date(notification.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                {!notification.read && (
                                                    <EnhancedButton
                                                        onClick={() => markAsRead(notification.id)}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="flex-shrink-0"
                                                        icon={<CheckCircle className="h-5 w-5" />}
                                                    >
                                                        Mark Read
                                                    </EnhancedButton>
                                                )}
                                            </div>
                                        </GlassContainer>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </Card3D>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}
