import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Bell, Calendar, CheckCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import axios from 'axios';

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
}

interface Notification {
    id: number;
    type: 'group_invitation' | 'assignment_due' | 'assignment_created';
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

    // Helper function to get notification icon
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'group_invitation':
                return <Users className="h-6 w-6 text-blue-500" />;
            case 'assignment_due':
                return <Calendar className="h-6 w-6 text-red-500" />;
            case 'assignment_created':
                return <Calendar className="h-6 w-6 text-green-500" />;
            default:
                return <Bell className="h-6 w-6 text-gray-500" />;
        }
    };

    // Helper function to get notification content
    const getNotificationContent = (notification: Notification) => {
        const { type, data } = notification;

        switch (type) {
            case 'group_invitation':
                return (
                    <div>
                        <p className="font-medium">Group Invitation</p>
                        <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">{data.inviter_name}</span> invited you to join the group <span className="font-medium">{data.group_name}</span>
                        </p>
                        <div className="mt-2">
                            <Link
                                href={route('groups.show', data.group_id)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                View Group
                            </Link>
                        </div>
                    </div>
                );
            case 'assignment_due':
                return (
                    <div>
                        <p className="font-medium">Assignment Due Soon</p>
                        <p className="text-gray-600 dark:text-gray-300">
                            Assignment <span className="font-medium">{data.assignment_title}</span> in group <span className="font-medium">{data.group_name}</span> is due on <span className="font-medium">{new Date(data.due_date!).toLocaleDateString()}</span>
                        </p>
                        <div className="mt-2">
                            <Link
                                href={route('group-assignments.show', data.assignment_id)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                View Assignment
                            </Link>
                        </div>
                    </div>
                );
            case 'assignment_created':
                return (
                    <div>
                        <p className="font-medium">New Assignment</p>
                        <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">{data.creator_name}</span> created a new assignment <span className="font-medium">{data.assignment_title}</span> in group <span className="font-medium">{data.group_name}</span>
                        </p>
                        <div className="mt-2">
                            <Link
                                href={route('group-assignments.show', data.assignment_id)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                View Assignment
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
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">Notifications</h1>

                        {notificationsList.some(n => !n.read) && (
                            <Button
                                onClick={markAllAsRead}
                                variant="outline"
                                size="sm"
                            >
                                Mark All as Read
                            </Button>
                        )}
                    </div>

                    {notificationsList.length === 0 ? (
                        <div className="text-center py-8">
                            <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {notificationsList.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`flex items-start gap-4 p-4 rounded-lg border ${notification.read
                                        ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800'
                                        : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                                        }`}
                                >
                                    <div className="flex-shrink-0">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-grow">
                                        {getNotificationContent(notification)}
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            {new Date(notification.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <Button
                                            onClick={() => markAsRead(notification.id)}
                                            variant="ghost"
                                            size="sm"
                                            className="flex-shrink-0"
                                        >
                                            <CheckCircle className="h-5 w-5" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
} 