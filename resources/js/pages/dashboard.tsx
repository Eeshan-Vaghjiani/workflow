import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Calendar, Clock, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Group {
    id: number;
    name: string;
    members_count: number;
    assignments_count: number;
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

interface Props {
    groups: Group[];
    assignments: Assignment[];
    tasks: Task[];
    your_generic_secret: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard({ groups, assignments, tasks, your_generic_secret }: Props) {
    // Calculate upcoming tasks (due in the next 3 days)
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    const upcomingTasks = tasks.filter(task => {
        const dueDate = new Date(task.end_date);
        return task.status !== 'completed' && dueDate <= threeDaysFromNow;
    });

    return (
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
                                <p className="text-xs text-muted-foreground">
                                    View assignments and tasks in a calendar format
                                </p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/dashboard/gantt">
                        <Card className="hover:border-blue-500 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Gantt Chart</CardTitle>
                                <GitBranch className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">
                                    Track project tasks and timelines with Gantt view
                                </p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/notifications">
                        <Card className={`relative hover:border-blue-500 transition-colors ${your_generic_secret > 0 ? 'border-red-300 dark:border-red-800' : ''}`}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                                <div className="relative">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    {your_generic_secret > 0 && (
                                        <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-red-500 text-[10px] flex items-center justify-center text-white">
                                            {your_generic_secret}
                                        </span>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">
                                    {your_generic_secret > 0
                                        ? `You have ${your_generic_secret} unread notification${your_generic_secret > 1 ? 's' : ''}`
                                        : 'No new notifications'
                                    }
                                </p>
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
                            {groups.length === 0 ? (
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
                                <Link href="/group-assignments">
                                    <Button variant="ghost" size="sm">View All</Button>
                                </Link>
                            </div>
                            <CardDescription>Your latest assignments</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {assignments.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">No assignments yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {assignments.map(assignment => (
                                        <div key={assignment.id} className="p-2 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-md">
                                            <Link href={route('group-assignments.show', assignment.id)} className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400">
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
                            <Link href="/group-assignments/create" className="w-full">
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
                                    {upcomingTasks.map(task => (
                                        <div key={task.id} className="p-2 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-md">
                                            <div className="flex justify-between">
                                                <Link href={route('group-tasks.show', task.id)} className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400">
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
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
