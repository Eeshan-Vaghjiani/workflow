import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Bell, Calendar, CheckCircle, Users, MessageSquare } from 'lucide-react';
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
    sender_id?: number;
    sender_name?: string;
    content?: string;
    task_id?: number;
    task_title?: string;
    requester_id?: number;
    requester_name?: string;
    approver_id?: number;
    approver_name?: string;
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
                return <Users className="h-6 w-6 text-blue-500" />;
            case 'assignment_due':
                return <Calendar className="h-6 w-6 text-red-500" />;
            case 'assignment_created':
                return <Calendar className="h-6 w-6 text-green-500" />;
            case 'direct_message':
            case 'group_message':
                return <MessageSquare className="h-6 w-6 text-purple-500" />;
            case 'task_assignment':
            case 'deadline_reminder':
                return <CheckCircle className="h-6 w-6 text-yellow-500" />;
            case 'group_join_request':
            case 'group_join_approved':
                return <Users className="h-6 w-6 text-indigo-500" />;
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
                                href={route('group-assignments.show', { group: data.group_id, assignment: data.assignment_id })}
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
                                href={route('group-assignments.show', { group: data.group_id, assignment: data.assignment_id })}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                View Assignment
                            </Link>
                        </div>
                    </div>
                );
            case 'direct_message':
                return (
                    <div>
                        <p className="font-medium">New Direct Message</p>
                        <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">{data.sender_name}</span> sent you a message: <span className="font-medium">{data.content}</span>
                        </p>
                        <div className="mt-2">
                            <Link
                                href={route('chat.direct', data.sender_id)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                View Message
                            </Link>
                        </div>
                    </div>
                );
            case 'group_message':
                return (
                    <div>
                        <p className="font-medium">New Group Message</p>
                        <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">{data.sender_name}</span> sent a message in <span className="font-medium">{data.group_name}</span>: <span className="font-medium">{data.content}</span>
                        </p>
                        <div className="mt-2">
                            <Link
                                href={route('chat.group', data.group_id)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                View Message
                            </Link>
                        </div>
                    </div>
                );
            case 'task_assignment':
                return (
                    <div>
                        <p className="font-medium">New Task Assignment</p>
                        <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">{data.assigner_name}</span> assigned you a task <span className="font-medium">{data.task_title}</span> in <span className="font-medium">{data.group_name}</span>
                        </p>
                        <div className="mt-2">
                            <Link
                                href={route('group-tasks.show', { group: data.group_id, task: data.task_id })}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                View Task
                            </Link>
                        </div>
                    </div>
                );
            case 'deadline_reminder':
                return (
                    <div>
                        <p className="font-medium">Task Deadline Reminder</p>
                        <p className="text-gray-600 dark:text-gray-300">
                            Task <span className="font-medium">{data.task_title}</span> in <span className="font-medium">{data.group_name}</span> is due soon
                        </p>
                        <div className="mt-2">
                            <Link
                                href={route('group-tasks.show', { group: data.group_id, task: data.task_id })}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                View Task
                            </Link>
                        </div>
                    </div>
                );
            case 'group_join_request':
                return (
                    <div>
                        <p className="font-medium">Group Join Request</p>
                        <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">{data.requester_name}</span> requested to join <span className="font-medium">{data.group_name}</span>
                        </p>
                        <div className="mt-2">
                            <Link
                                href={route('groups.members.index', data.group_id)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                View Request
                            </Link>
                        </div>
                    </div>
                );
            case 'group_join_approved':
                return (
                    <div>
                        <p className="font-medium">Join Request Approved</p>
                        <p className="text-gray-600 dark:text-gray-300">
                            Your request to join <span className="font-medium">{data.group_name}</span> was approved by <span className="font-medium">{data.approver_name}</span>
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
