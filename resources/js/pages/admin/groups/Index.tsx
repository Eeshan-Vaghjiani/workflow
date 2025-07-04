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
        <>
            <Head title="Manage Groups" />
            <div className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold">Manage Groups</h1>
                    <Button onClick={handleDownloadPdf} className="flex items-center gap-2">
                        <FileDown className="h-4 w-4" />
                        <span>Download PDF</span>
                    </Button>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Group List</h2>
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
                                    <TableCell colSpan={4} className="text-center">
                                        No groups found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    );
};

export default GroupsIndex;
