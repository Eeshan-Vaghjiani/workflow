import React from 'react';
import { Head, router } from '@inertiajs/react';
import { motion, Variants } from 'framer-motion';
import { format } from 'date-fns';
import AdminLayout from '@/layouts/admin-layout';
import { Card3D } from '@/components/ui/card-3d';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Edit2, Trash2, Users } from 'lucide-react';

// Interfaces
interface Member {
    id: number;
    name: string;
    email: string;
    joined_at: string;
}

interface Assignment {
    id: number;
    title: string;
    due_date: string;
    created_at: string;
    tasks_count: number;
}

interface Group {
    id: number;
    name: string;
    description: string;
    is_public: boolean;
    created_at: string;
    members: Member[];
    assignments: Assignment[];
    owner: {
        name: string;
        email: string;
    };
}

interface GroupShowProps {
    group: Group;
}

// Animation Variants
const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } } };

// Component
const GroupShow: React.FC<GroupShowProps> = ({ group }) => {
    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete the group "${group.name}"?`)) {
            router.delete(route('admin.groups.destroy', group.id));
        }
    };

    return (
        <AdminLayout>
            <Head title={`Group: ${group.name}`} />
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                <motion.div variants={itemVariants} className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[rgb(17,24,39)] dark:text-white">{group.name}</h1>
                        <p className="text-[rgb(75,85,99)] dark:text-[rgb(156,163,175)]">Group Details</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => router.visit(route('admin.groups.index'))} variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />Back to Groups
                        </Button>
                        <Button onClick={() => router.visit(route('admin.groups.edit', group.id))} variant="outline" size="sm">
                            <Edit2 className="h-4 w-4 mr-2" />Edit
                        </Button>
                        <Button onClick={handleDelete} variant="danger" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />Delete
                        </Button>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card3D className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Group Information</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                                <p className="font-medium">{group.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                                <p>{group.description || 'No description provided'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Owner</p>
                                <p>{group.owner.name} ({group.owner.email})</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Visibility</p>
                                <Badge variant={group.is_public ? 'success' : 'secondary'}>
                                    {group.is_public ? 'Public' : 'Private'}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                                <p>{format(new Date(group.created_at), 'PPP')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Members</p>
                                <p className="flex items-center">
                                    <Users className="h-4 w-4 mr-2" />
                                    {group.members.length} members
                                </p>
                            </div>
                        </div>
                    </Card3D>

                    <Card3D className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Members</h2>
                        <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Joined</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {group.members.length > 0 ? (
                                        group.members.map((member) => (
                                            <TableRow key={member.id}>
                                                <TableCell className="font-medium">{member.name}</TableCell>
                                                <TableCell>{member.email}</TableCell>
                                                <TableCell>{member.joined_at ? format(new Date(member.joined_at), 'PP') : 'N/A'}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-4">No members found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card3D>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card3D className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Assignments</h2>
                        <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead>Tasks</TableHead>
                                        <TableHead>Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {group.assignments && group.assignments.length > 0 ? (
                                        group.assignments.map((assignment) => (
                                            <TableRow key={assignment.id}>
                                                <TableCell className="font-medium">{assignment.title}</TableCell>
                                                <TableCell>{assignment.due_date ? format(new Date(assignment.due_date), 'PP') : 'No due date'}</TableCell>
                                                <TableCell>{assignment.tasks_count}</TableCell>
                                                <TableCell>{format(new Date(assignment.created_at), 'PP')}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-4">No assignments found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card3D>
                </motion.div>
            </motion.div>
        </AdminLayout>
    );
};

export default GroupShow;
