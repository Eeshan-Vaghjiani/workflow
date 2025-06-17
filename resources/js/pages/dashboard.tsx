import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Calendar, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageProps } from "@/types"
import { ChatList } from "@/components/Chat/chat-list"
import { ChatWindow } from "@/components/Chat/chat-window"
import { useState, useEffect, useMemo } from "react"
import { ErrorBoundary } from 'react-error-boundary'
import { toast } from "@/components/ui/use-toast"

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
        <div className="p-4 text-red-500">
            <h2 className="text-lg font-semibold">Something went wrong:</h2>
            <pre className="mt-2 text-sm">{error.message}</pre>
            <button
                onClick={resetErrorBoundary}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Try again
            </button>
        </div>
    )
}

function LoadingState() {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
        </div>
    );
}

export default function Dashboard(props: Props) {
    // Initialize state with safe default values
    const [isLoading, setIsLoading] = useState(true);
    const [selectedChatId, setSelectedChatId] = useState<number>();
    const [error, setError] = useState<Error | null>(null);
    const [messages, setMessages] = useState<{ id: number; content: string; sender: { id: number; name: string; avatar: string }; timestamp: string; isSystemMessage: boolean }[]>([]);

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

    // Memoize the current user object
    const currentUser = useMemo(() => ({
        id: auth?.user?.id || 0,
        name: auth?.user?.name || 'Unknown User',
        avatar: auth?.user?.avatar,
        status: "online" as const
    }), [auth]);

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

                    // If we have the chat open, add new message
                    if (selectedChatId === event.groupId) {
                        setMessages(prev => [...prev, {
                            id: event.message.id,
                            content: event.message.content,
                            sender: event.message.sender,
                            timestamp: event.message.timestamp,
                            isSystemMessage: event.message.is_system_message
                        }]);
                    }

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
    }, [auth, selectedChatId]);

    // Handle message sending
    const handleSendMessage = async (content: string) => {
        setIsLoading(true);
        try {
            // TODO: Implement message sending
            console.log("Sending message:", content);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        } catch (e) {
            console.error('Error sending message:', e);
            setError(e instanceof Error ? e : new Error('Failed to send message'));
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading state
    if (isLoading) {
        return <LoadingState />;
    }

    // Show error state
    if (error) {
        return (
            <div className="p-4 text-red-500">
                <h2 className="text-lg font-semibold">Error loading dashboard:</h2>
                <pre className="mt-2 text-sm">{error.message}</pre>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Reload Page
                </button>
            </div>
        );
    }

    return (
        <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onReset={() => window.location.reload()}
        >
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard" />
                <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                    {/* View Toggles */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                        <Link href="/dashboard/calendar">
                            <Card className="hover:border-blue-500 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Calendar View</CardTitle>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm">
                                        Manage your tasks on a calendar
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                        <Link href="/dashboard/gantt">
                            <Card className="hover:border-blue-500 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Gantt View</CardTitle>
                                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm">
                                        Track project progress and timelines
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                        <Link href="/mpesa">
                            <Card className="hover:border-blue-500 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">M-Pesa Payment</CardTitle>
                                    <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 6V18M18 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm">
                                        Make payment with M-Pesa
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {/* Groups Section */}
                        <Card className="col-span-1">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>Your Groups</CardTitle>
                                    <Link href="/groups">
                                        <Button variant="ghost" size="sm">View All</Button>
                                    </Link>
                                </div>
                                <CardDescription>Groups you are a member of</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!Array.isArray(groups) || groups.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-4">No groups yet</p>
                                ) : (
                                    <div className="space-y-2">
                                        {groups.map(group => (
                                            <div key={group.id} className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-md">
                                                <div>
                                                    <Link href={route('groups.show', group.id)} className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400">
                                                        {group.name}
                                                    </Link>
                                                    <p className="text-xs text-gray-500">{group.members_count} members</p>
                                                </div>
                                                <div className="text-sm text-gray-500">{group.assignments_count} assignments</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Link href={route('groups.create')} className="w-full">
                                    <Button className="w-full">Create New Group</Button>
                                </Link>
                            </CardFooter>
                        </Card>

                        {/* Assignments Section */}
                        <Card className="col-span-1">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>Recent Assignments</CardTitle>
                                    <Link href="/assignments">
                                        <Button variant="ghost" size="sm">View All</Button>
                                    </Link>
                                </div>
                                <CardDescription>Your latest assignments</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!Array.isArray(assignments) || assignments.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-4">No assignments yet</p>
                                ) : (
                                    <div className="space-y-2">
                                        {assignments.map(assignment => (
                                            <div key={assignment.id} className="p-2 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-md">
                                                <Link href={route('group-assignments.show', { group: assignment.group.id, assignment: assignment.id })} className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400">
                                                    {assignment.title}
                                                </Link>
                                                <div className="flex justify-between text-xs mt-1">
                                                    <span className="text-gray-500">
                                                        Group: <Link href={route('groups.show', assignment.group.id)} className="text-blue-500 hover:text-blue-700">{assignment.group.name}</Link>
                                                    </span>
                                                    <span className="text-gray-500">Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Link href={route('groups.index')} className="w-full">
                                    <Button className="w-full">Create New Assignment</Button>
                                </Link>
                            </CardFooter>
                        </Card>

                        {/* Upcoming Tasks Section */}
                        <Card className="col-span-1">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>Upcoming Tasks</CardTitle>
                                    <Link href="/tasks">
                                        <Button variant="ghost" size="sm">View All</Button>
                                    </Link>
                                </div>
                                <CardDescription>Tasks due in the next 3 days</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {upcomingTasks.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-4">No upcoming tasks</p>
                                ) : (
                                    <div className="space-y-2">
                                        {upcomingTasks.map(task => {
                                            const assignment = assignments.find(a => a.id === task.assignment.id) as Assignment | undefined;
                                            const groupId = assignment?.group.id;
                                            return (
                                                <div key={task.id} className="p-2 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-md">
                                                    <div className="flex justify-between">
                                                        <Link href={groupId
                                                            ? route('group-tasks.show', { group: groupId, assignment: task.assignment.id, task: task.id })
                                                            : `/tasks/${task.id}`} className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400">
                                                            {task.title}
                                                        </Link>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs ${task.status === 'completed'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300'
                                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300'
                                                            }`}>
                                                            {task.status === 'completed' ? 'Completed' : 'Pending'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-xs mt-1">
                                                        <span className="text-gray-500">Assignment: {task.assignment.title}</span>
                                                        <span className="text-gray-500">Due: {new Date(task.end_date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
                <div className="flex h-[500px] mt-6 border rounded-xl overflow-hidden">
                    <div className="w-1/4 border-r">
                        <div className="flex items-center justify-between p-3 border-b">
                            <h3 className="font-semibold text-lg">Chat</h3>
                            <Link href="/chat" className="text-blue-600 hover:text-blue-800 text-sm">
                                View All
                            </Link>
                        </div>
                        <ChatList
                            chats={groups.map(group => ({
                                id: group.id,
                                name: group.name,
                                avatar: group.avatar,
                                lastMessage: group.lastMessage,
                                unreadCount: group.unreadCount || 0
                            }))}
                            selectedChatId={selectedChatId}
                            onChatSelect={async (chatId) => {
                                setIsLoading(true);
                                setSelectedChatId(chatId);

                                try {
                                    // Fetch messages from the API
                                    const response = await fetch(`/api/web/groups/${chatId}/messages`);
                                    if (!response.ok) throw new Error('Failed to load messages');

                                    const data = await response.json();
                                    // Convert messages to the format expected by ChatWindow
                                    const formattedMessages = data.map(msg => ({
                                        id: msg.id,
                                        content: msg.message,
                                        sender: {
                                            id: msg.user.id,
                                            name: msg.user.name,
                                            avatar: msg.user.avatar
                                        },
                                        timestamp: new Date(msg.created_at).toLocaleTimeString(),
                                        isSystemMessage: msg.is_system_message
                                    }));

                                    setMessages(formattedMessages);

                                    // Reset unread count for this group
                                    setGroups(prev => prev.map(g => {
                                        if (g.id === chatId) {
                                            return { ...g, unreadCount: 0 };
                                        }
                                        return g;
                                    }));
                                } catch (e) {
                                    console.error('Error loading messages:', e);
                                    toast({
                                        title: "Error",
                                        description: "Failed to load messages. Please try again.",
                                        variant: "destructive"
                                    });
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                        />
                    </div>
                    <div className="flex-1">
                        {selectedChatId ? (
                            <ChatWindow
                                user={{
                                    id: selectedChatId,
                                    name: groups.find(g => g.id === selectedChatId)?.name || 'Chat',
                                    status: "online"
                                }}
                                messages={messages}
                                currentUserId={auth.user.id}
                                onSendMessage={async (content) => {
                                    if (!selectedChatId) return;

                                    try {
                                        setIsLoading(true);
                                        const response = await fetch(`/api/web/groups/${selectedChatId}/messages`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                                            },
                                            body: JSON.stringify({ message: content })
                                        });

                                        if (!response.ok) throw new Error('Failed to send message');

                                        const newMessage = await response.json();

                                        // Add the new message to the messages array
                                        setMessages(prev => [...prev, {
                                            id: newMessage.id,
                                            content: newMessage.message,
                                            sender: {
                                                id: newMessage.user.id,
                                                name: newMessage.user.name,
                                                avatar: newMessage.user.avatar
                                            },
                                            timestamp: new Date(newMessage.created_at).toLocaleTimeString(),
                                            isSystemMessage: newMessage.is_system_message
                                        }]);

                                    } catch (e) {
                                        console.error('Error sending message:', e);
                                        toast({
                                            title: "Error",
                                            description: "Failed to send message. Please try again.",
                                            variant: "destructive"
                                        });
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                                isLoading={isLoading}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <div className="text-center">
                                    <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Choose a group chat from the list to start messaging
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </AppLayout>
        </ErrorBoundary>
    );
}
