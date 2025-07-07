import React from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { Card } from '@/components/ui/card';

interface Group {
    id: number;
    name: string;
    created_at: string;
    members_count: number;
}

interface Props {
    groups: Group[];
}

const GroupsIndex: React.FC<Props> = ({ groups }) => {
    const handleDownloadPdf = () => {
        window.location.href = route('admin.groups.pdf');
    };

    return (
        <AdminLayout>
            <Head title="Manage Groups" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Groups</h1>
                        <p className="text-gray-600 dark:text-gray-400">View and manage all groups in the system</p>
                    </div>
                    <Button onClick={handleDownloadPdf} className="flex items-center gap-2">
                        <FileDown className="h-4 w-4" />
                        <span>Download PDF</span>
                    </Button>
                </div>

                <Card className="overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Group List</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Members</TableHead>
                                    <TableHead>Created At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {groups.length > 0 ? (
                                    groups.map((group) => (
                                        <TableRow key={group.id}>
                                            <TableCell>{group.id}</TableCell>
                                            <TableCell className="font-medium">{group.name}</TableCell>
                                            <TableCell>{group.members_count}</TableCell>
                                            <TableCell>{new Date(group.created_at).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8">
                                            No groups found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </AdminLayout>
    );
};

export default GroupsIndex;
