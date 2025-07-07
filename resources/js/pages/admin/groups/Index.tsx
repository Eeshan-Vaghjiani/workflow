import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion, Variants } from 'framer-motion';
import { format } from 'date-fns';
import { useDebounce } from 'use-debounce';
import AdminLayout from '@/layouts/admin-layout';
import { Card3D } from '@/components/ui/card-3d';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, FileDown, Trash2, Edit2, RefreshCw, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

// Interfaces
interface Group {
    id: number;
    name: string;
    created_at: string;
    members_count: number;
    deleted_at: string | null;
    owner: {
        name: string;
        email: string;
    };
}

interface GroupsPageProps {
    groups: {
        data: Group[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        search: string;
    };
}

// Animation Variants
const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } } };

// Component
const GroupsIndex: React.FC<GroupsPageProps> = ({ groups, filters }) => {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

    useEffect(() => {
        if (debouncedSearchTerm !== (filters?.search || '')) {
            router.get(route('admin.groups.index'), { search: debouncedSearchTerm }, { preserveState: true, replace: true });
        }
    }, [debouncedSearchTerm, filters?.search]);

    const handleDownloadPdf = () => window.location.href = route('admin.groups.pdf');
    const handleDelete = (group: Group) => {
        setSelectedGroup(group);
        setDeleteDialogOpen(true);
    };
    const handleRestore = (group: Group) => router.post(route('admin.groups.restore', group.id), {}, { preserveScroll: true });

    const confirmDelete = () => {
        if (selectedGroup) {
            router.delete(route('admin.groups.destroy', selectedGroup.id), {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setSelectedGroup(null);
                },
                preserveScroll: true,
            });
        }
    };

    return (
        <AdminLayout>
            <Head title="Manage Groups" />
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                <motion.div variants={itemVariants} className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[rgb(17,24,39)] dark:text-white">Manage Groups</h1>
                        <p className="text-[rgb(75,85,99)] dark:text-[rgb(156,163,175)]">A list of all groups in the system.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => router.reload()} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
                        <Button onClick={handleDownloadPdf}><FileDown className="h-4 w-4 mr-2" />Export PDF</Button>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card3D className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by name or owner..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Owner</TableHead>
                                        <TableHead>Members</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created At</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groups.data.length > 0 ? (
                                        groups.data.map((group) => (
                                            <TableRow key={group.id}>
                                                <TableCell className="font-medium">{group.name}</TableCell>
                                                <TableCell>{group.owner.name}</TableCell>
                                                <TableCell>{group.members_count}</TableCell>
                                                <TableCell><Badge variant={group.deleted_at ? 'danger' : 'success'}>{group.deleted_at ? 'Deleted' : 'Active'}</Badge></TableCell>
                                                <TableCell>{format(new Date(group.created_at), 'PPP')}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => router.visit(route('admin.groups.show', group.id))}><Eye className="h-4 w-4" /></Button>
                                                        {!group.deleted_at ? (
                                                            <>
                                                                <Button variant="ghost" size="icon" onClick={() => router.visit(route('admin.groups.edit', group.id))}><Edit2 className="h-4 w-4" /></Button>
                                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(group)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                                            </>
                                                        ) : (
                                                            <Button variant="ghost" size="icon" onClick={() => handleRestore(group)}><RefreshCw className="h-4 w-4 text-green-500" /></Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={6} className="text-center py-16">No groups found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {groups.total > groups.per_page && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-gray-500">Showing {groups.data.length} of {groups.total} groups</p>
                                <div className="flex items-center gap-2">
                                    <Button onClick={() => router.get(groups.links[0].url!)} disabled={!groups.links[0].url} variant="outline" size="sm"><ChevronLeft className="h-4 w-4 mr-1"/> Previous</Button>
                                    <Button onClick={() => router.get(groups.links[groups.links.length - 1].url!)} disabled={!groups.links[groups.links.length - 1].url} variant="outline" size="sm">Next <ChevronRight className="h-4 w-4 ml-1"/></Button>
                                </div>
                            </div>
                        )}
                    </Card3D>
                </motion.div>
            </motion.div>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>This will soft delete the group "{selectedGroup?.name}". This action can be undone later.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="danger" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
};

export default GroupsIndex;
