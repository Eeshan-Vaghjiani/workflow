import React, { useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    FileText,
    Search,
    Download,
    Eye,
    Edit,
    Trash2,
    RotateCcw,
    Calendar,
    CheckCircle,
    Clock,
} from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
    tasks_count: number;
}

interface Props {
    assignments: {
        data: Assignment[];
        links: any[];
        total: number;
    };
    filters: {
        search?: string;
    };
}

const Index = ({ assignments, filters }: Props) => {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [confirmRestoreId, setConfirmRestoreId] = useState<number | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.assignments.index'), { search: searchTerm }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (id: number) => {
        router.delete(route('admin.assignments.destroy', id), {
            onSuccess: () => {
                setConfirmDeleteId(null);
            },
        });
    };

    const handleRestore = (id: number) => {
        router.post(route('admin.assignments.restore', id), {}, {
            onSuccess: () => {
                setConfirmRestoreId(null);
            },
        });
    };

    const getDueDateStatus = (dueDate: string | null) => {
        if (!dueDate) return null;

        const now = new Date();
        const due = new Date(dueDate);

        if (due < now) {
            return <Badge variant="destructive">Overdue</Badge>;
        }

        const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays <= 3) {
            return <Badge variant="warning">Due soon</Badge>;
        }

        return <Badge variant="outline">Upcoming</Badge>;
    };

    return (
        <AdminLayout>
            <Head title="Assignments Management" />
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Assignments Management</h1>
                    <div className="flex space-x-2">
                        <Link href={route('admin.assignments.pdf')}>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Export PDF
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card className="mb-6">
                    <CardHeader className="pb-3">
                        <CardTitle>Search Assignments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                placeholder="Search by title, description or group..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1"
                            />
                            <Button type="submit" className="flex items-center gap-2">
                                <Search className="h-4 w-4" />
                                Search
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Group</TableHead>
                                    <TableHead>Created By</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Tasks</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignments.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                            No assignments found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    assignments.data.map((assignment) => (
                                        <TableRow
                                            key={assignment.id}
                                            className={assignment.deleted_at ? 'bg-red-50' : ''}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-gray-500" />
                                                    <span className={assignment.deleted_at ? 'line-through text-gray-500' : ''}>
                                                        {assignment.title}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{assignment.group?.name || 'N/A'}</TableCell>
                                            <TableCell>{assignment.created_by?.name || 'N/A'}</TableCell>
                                            <TableCell>
                                                {assignment.due_date ? (
                                                    <div className="flex flex-col">
                                                        <span>{new Date(assignment.due_date).toLocaleDateString()}</span>
                                                        <span className="text-xs text-gray-500">
                                                            {getDueDateStatus(assignment.due_date)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    'No due date'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{assignment.tasks_count}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {assignment.deleted_at ? (
                                                    <Badge variant="destructive">Deleted</Badge>
                                                ) : (
                                                    <Badge variant="success">Active</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={route('admin.assignments.show', assignment.id)}>
                                                        <Button variant="ghost" size="icon" title="View">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>

                                                    {!assignment.deleted_at && (
                                                        <>
                                                            <Link href={route('admin.assignments.edit', assignment.id)}>
                                                                <Button variant="ghost" size="icon" title="Edit">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </Link>

                                                            <Dialog open={confirmDeleteId === assignment.id} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                        title="Delete"
                                                                        onClick={() => setConfirmDeleteId(assignment.id)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent>
                                                                    <DialogHeader>
                                                                        <DialogTitle>Confirm Deletion</DialogTitle>
                                                                    </DialogHeader>
                                                                    <div className="py-4">
                                                                        <p>Are you sure you want to delete this assignment?</p>
                                                                        <p className="text-sm text-gray-500 mt-2">
                                                                            This will soft delete the assignment and it can be restored later.
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex justify-end gap-2">
                                                                        <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
                                                                            Cancel
                                                                        </Button>
                                                                        <Button
                                                                            variant="destructive"
                                                                            onClick={() => handleDelete(assignment.id)}
                                                                        >
                                                                            Delete
                                                                        </Button>
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </>
                                                    )}

                                                    {assignment.deleted_at && (
                                                        <Dialog open={confirmRestoreId === assignment.id} onOpenChange={(open) => !open && setConfirmRestoreId(null)}>
                                                            <DialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-green-500 hover:text-green-700 hover:bg-green-50"
                                                                    title="Restore"
                                                                    onClick={() => setConfirmRestoreId(assignment.id)}
                                                                >
                                                                    <RotateCcw className="h-4 w-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>Confirm Restoration</DialogTitle>
                                                                </DialogHeader>
                                                                <div className="py-4">
                                                                    <p>Are you sure you want to restore this assignment?</p>
                                                                </div>
                                                                <div className="flex justify-end gap-2">
                                                                    <Button variant="outline" onClick={() => setConfirmRestoreId(null)}>
                                                                        Cancel
                                                                    </Button>
                                                                    <Button
                                                                        variant="default"
                                                                        onClick={() => handleRestore(assignment.id)}
                                                                    >
                                                                        Restore
                                                                    </Button>
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {assignments.links && assignments.links.length > 3 && (
                    <div className="mt-4">
                        <Pagination links={assignments.links} />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default Index;
