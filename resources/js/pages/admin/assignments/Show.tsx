import React from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ArrowLeft,
    Calendar,
    Edit,
    User,
    Users,
    CheckSquare,
    Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Task {
    id: number;
    title: string;
    description: string | null;
    due_date: string | null;
    is_completed: boolean;
    assigned_to: {
        id: number;
        name: string;
    } | null;
}

interface Assignment {
    id: number;
    title: string;
    description: string;
    due_date: string | null;
    unit_name: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    group: {
        id: number;
        name: string;
    };
    created_by: {
        id: number;
        name: string;
    };
    tasks: Task[];
}

interface Props {
    assignment: Assignment;
}

const Show = ({ assignment }: Props) => {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'No date set';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const completedTasksCount = assignment.tasks.filter(task => task.is_completed).length;
    const completionPercentage = assignment.tasks.length > 0
        ? Math.round((completedTasksCount / assignment.tasks.length) * 100)
        : 0;

    return (
        <AdminLayout>
            <Head title={`Assignment: ${assignment.title}`} />
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Link href={route('admin.assignments.index')}>
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h1 className="text-2xl font-bold">{assignment.title}</h1>
                        {assignment.deleted_at && (
                            <Badge variant="destructive" className="ml-2">Deleted</Badge>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {!assignment.deleted_at && (
                            <Link href={route('admin.assignments.edit', assignment.id)}>
                                <Button variant="outline" className="flex items-center gap-2">
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Group</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">{assignment.group?.name || 'N/A'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Created By</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">{assignment.created_by?.name || 'N/A'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Due Date</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">{formatDate(assignment.due_date)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {assignment.description ? (
                                <div className="prose max-w-none">
                                    <p>{assignment.description}</p>
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">No description provided</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {assignment.unit_name && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Unit Name</p>
                                    <p>{assignment.unit_name}</p>
                                </div>
                            )}

                            <div>
                                <p className="text-sm font-medium text-gray-500">Created At</p>
                                <p>{formatDate(assignment.created_at)}</p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                                <p>{formatDate(assignment.updated_at)}</p>
                            </div>

                            {assignment.deleted_at && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Deleted At</p>
                                    <p>{formatDate(assignment.deleted_at)}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Tasks ({assignment.tasks.length})</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="text-sm text-gray-500">
                                {completedTasksCount} of {assignment.tasks.length} completed
                            </div>
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 rounded-full"
                                    style={{ width: `${completionPercentage}%` }}
                                />
                            </div>
                            <div className="text-sm font-medium">{completionPercentage}%</div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {assignment.tasks.length === 0 ? (
                            <p className="text-center py-6 text-gray-500">No tasks found for this assignment</p>
                        ) : (
                            <div className="space-y-4">
                                {assignment.tasks.map(task => (
                                    <div
                                        key={task.id}
                                        className={`p-4 border rounded-lg ${task.is_completed ? 'bg-green-50 border-green-200' : 'bg-white'}`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <CheckSquare className={`h-5 w-5 ${task.is_completed ? 'text-green-500' : 'text-gray-400'}`} />
                                                <h3 className={`font-medium ${task.is_completed ? 'line-through text-gray-500' : ''}`}>
                                                    {task.title}
                                                </h3>
                                            </div>
                                            {task.assigned_to && (
                                                <Badge variant="outline" className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {task.assigned_to.name}
                                                </Badge>
                                            )}
                                        </div>

                                        {task.description && (
                                            <div className="mt-2 text-sm text-gray-600">
                                                {task.description}
                                            </div>
                                        )}

                                        {task.due_date && (
                                            <div className="mt-2 flex items-center text-xs text-gray-500">
                                                <Clock className="h-3 w-3 mr-1" />
                                                Due: {formatDate(task.due_date)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
};

export default Show;
