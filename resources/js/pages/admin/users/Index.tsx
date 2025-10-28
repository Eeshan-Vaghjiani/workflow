import React, { useState, useEffect } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { motion } from 'framer-motion';
import { useDebounce } from 'use-debounce';
import {
    Search,
    Plus,
    Edit,
    Download,
    Filter,
    RefreshCw,
    Trash2
} from 'lucide-react';
import { Card3D } from '@/components/ui/card-3d';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { generatePDFReport } from '@/lib/pdfUtils';
import { format } from 'date-fns';

// Define interface for user data
interface User {
    id: number;
    name: string;
    email: string;
    role: 'ADMIN' | 'USER';
    created_at: string;
    last_login_at: string | null;
    deleted_at: string | null;
}

interface UsersPageProps {
    users: {
        data: User[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
    };
    filters: {
        search: string;
    };
}

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring" as const,
            stiffness: 100,
            damping: 15
        }
    }
};

export default function UsersIndex({ users, filters }: UsersPageProps) {
    const [searchTerm, setSearchTerm] = useState((filters?.search) || '');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        is_admin: false,
    });

    useEffect(() => {
        if (debouncedSearchTerm !== ((filters?.search) || '')) {
            router.get(
                route('admin.users.index'),
                { search: debouncedSearchTerm },
                {
                    preserveState: true,
                    replace: true,
                }
            );
        }
    }, [debouncedSearchTerm, filters?.search]);

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/admin/users', formData, {
            onSuccess: () => {
                setIsAddUserOpen(false);
                setFormData({ name: '', email: '', password: '', is_admin: false });
            }
        });
    };

    // Handle user update
    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        router.put(`/admin/users/${selectedUser.id}`, formData, {
            onSuccess: () => {
                setIsEditUserOpen(false);
                setSelectedUser(null);
                setFormData({ name: '', email: '', password: '', is_admin: false });
            }
        });
    };

    // Handle user deletion
    const handleDelete = (user: User) => {
        if (confirm('Are you sure you want to delete this user?')) {
            router.delete(`/admin/users/${user.id}`);
        }
    };

    // Handle user restoration
    const handleRestore = (user: User) => {
        if (confirm('Are you sure you want to restore this user?')) {
            router.post(`/admin/users/${user.id}/restore`);
        }
    };

    // Open edit dialog
    const openEditDialog = (user: User) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            is_admin: user.role === 'ADMIN',
        });
        setIsEditUserOpen(true);
    };

    // New PDF export function using our utility
    const handleExportPDF = async () => {
        try {
            await generatePDFReport({
                fileName: `users-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
                reportTitle: 'User Management Report',
                tables: [
                    {
                        title: 'Active Users',
                        head: [['ID', 'Name', 'Email', 'Role', 'Created', 'Last Login']],
                        body: users.data
                            .filter(user => !user.deleted_at)
                            .map(user => [
                                user.id,
                                user.name,
                                user.email,
                                user.role,
                                format(new Date(user.created_at), 'PPP'),
                                user.last_login_at ? format(new Date(user.last_login_at), 'PPP') : 'Never'
                            ])
                    },
                    {
                        title: 'Deleted Users',
                        head: [['ID', 'Name', 'Email', 'Role', 'Created', 'Deleted At']],
                        body: users.data
                            .filter(user => user.deleted_at)
                            .map(user => [
                                user.id,
                                user.name,
                                user.email,
                                user.role,
                                format(new Date(user.created_at), 'PPP'),
                                user.deleted_at ? format(new Date(user.deleted_at), 'PPP') : ''
                            ])
                    }
                ]
            });
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Failed to generate PDF report. Please try again.');
        }
    };

    return (
        <AdminLayout>
            <Head title="User Management" />

            <motion.div
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage user accounts and permissions</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add User
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New User</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_admin"
                                            checked={formData.is_admin}
                                            onCheckedChange={(checked) =>
                                                setFormData({ ...formData, is_admin: checked as boolean })
                                            }
                                        />
                                        <Label htmlFor="is_admin">Admin User</Label>
                                    </div>
                                    <Button type="submit" className="w-full">Add User</Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </motion.div>

                {/* Search and filters */}
                <motion.div variants={itemVariants}>
                    <Card3D className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="search"
                                    className="block w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-[#00887A] focus:border-[#00887A] dark:focus:ring-[#00ccb4] dark:focus:border-[#00ccb4]"
                                    placeholder="Search users by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" disabled>
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filter
                                </button>

                                <button
                                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    onClick={handleExportPDF}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </button>

                                <button
                                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    onClick={() => router.reload()}
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </Card3D>
                </motion.div>

                {/* Users Table */}
                <motion.div variants={itemVariants}>
                    <Card3D className="bg-white dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Last Login</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.data.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{format(new Date(user.created_at), 'PPP')}</TableCell>
                                            <TableCell>{user.last_login_at ? format(new Date(user.last_login_at), 'PPP') : 'Never'}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.deleted_at ? 'danger' : 'success'}>
                                                    {user.deleted_at ? 'Deleted' : 'Active'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {!user.deleted_at ? (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openEditDialog(user)}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDelete(user)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleRestore(user)}
                                                        >
                                                            <RefreshCw className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {users.links.length > 3 && (
                            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <Link href={users.links[0].url || ''} className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${!users.links[0].url ? 'text-gray-400 bg-gray-200 dark:bg-gray-700' : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600'}`}>Previous</Link>
                                    <Link href={users.links[users.links.length - 1].url || ''} className={`ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${!users.links[users.links.length - 1].url ? 'text-gray-400 bg-gray-200 dark:bg-gray-700' : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600'}`}>Next</Link>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700 dark:text-gray-400">
                                            Showing <span className="font-medium">{users.from}</span> to <span className="font-medium">{users.to}</span> of{' '}
                                            <span className="font-medium">{users.total}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            {users.links.map((link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || ''}
                                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${link.active ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'} dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card3D>
                </motion.div>
            </motion.div>

            {/* Edit User Dialog */}
            <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-password">Password (leave blank to keep current)</Label>
                            <Input
                                id="edit-password"
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="edit-is_admin"
                                checked={formData.is_admin}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, is_admin: checked as boolean })
                                }
                            />
                            <Label htmlFor="edit-is_admin">Admin User</Label>
                        </div>
                        <Button type="submit" className="w-full">Update User</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
