import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { motion } from 'framer-motion';
import {
    Search,
    Plus,
    Edit,
    Download,
    Filter,
    ChevronDown,
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
    is_admin: boolean;
    created_at: string;
    last_login_at: string | null;
    groups_count: number;
    role: 'ADMIN' | 'USER';
    deleted_at: string | null;
}

interface UsersPageProps {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
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

export default function UsersIndex({ users }: UsersPageProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        is_admin: false,
    });

    // Filter users based on search term
    const filteredUsers = users.data.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle search
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/admin/users', formData);
        setIsAddUserOpen(false);
        setFormData({ name: '', email: '', password: '', is_admin: false });
    };

    // Handle user update
    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        router.put(`/admin/users/${selectedUser.id}`, formData);
        setIsEditUserOpen(false);
        setSelectedUser(null);
        setFormData({ name: '', email: '', password: '', is_admin: false });
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
                        body: filteredUsers
                            .filter(user => !user.deleted_at)
                            .map(user => [
                                user.id,
                                user.name,
                                user.email,
                                user.role,
                                format(new Date(user.created_at), 'PPP'),
                                user.last_login_at
                                    ? format(new Date(user.last_login_at), 'PPP')
                                    : 'Never'
                            ])
                    },
                    {
                        title: 'Deleted Users',
                        head: [['ID', 'Name', 'Email', 'Role', 'Created', 'Deleted At']],
                        body: filteredUsers
                            .filter(user => user.deleted_at)
                            .map(user => [
                                user.id,
                                user.name,
                                user.email,
                                user.role,
                                format(new Date(user.created_at), 'PPP'),
                                format(new Date(user.deleted_at), 'PPP')
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
                        <Button onClick={handleExportPDF} variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export PDF
                        </Button>
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
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
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

                                <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
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
                                    {filteredUsers.map((user) => (
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
                        {users.last_page > 1 && (
                            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => router.get(route('admin.users.index', { page: users.current_page - 1 }))}
                                        disabled={users.current_page === 1}
                                        className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => router.get(route('admin.users.index', { page: users.current_page + 1 }))}
                                        disabled={users.current_page === users.last_page}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Showing <span className="font-medium">{(users.current_page - 1) * users.per_page + 1}</span> to <span className="font-medium">{Math.min(users.current_page * users.per_page, users.total)}</span> of <span className="font-medium">{users.total}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            <button
                                                onClick={() => router.get(route('admin.users.index', { page: users.current_page - 1 }))}
                                                disabled={users.current_page === 1}
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                                            >
                                                <span className="sr-only">Previous</span>
                                                <ChevronDown className="h-5 w-5 rotate-90" />
                                            </button>

                                            {/* Page numbers */}
                                            {Array.from({ length: users.last_page }, (_, i) => i + 1).map(page => (
                                                <button
                                                    key={page}
                                                    onClick={() => router.get(route('admin.users.index', { page }))}
                                                    className={`
                                                        relative inline-flex items-center px-4 py-2 border text-sm font-medium
                                                        ${users.current_page === page
                                                            ? 'z-10 bg-[#00887A] dark:bg-[#00887A] border-[#00887A] dark:border-[#00887A] text-white'
                                                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                        }
                                                    `}
                                                >
                                                    {page}
                                                </button>
                                            ))}

                                            <button
                                                onClick={() => router.get(route('admin.users.index', { page: users.current_page + 1 }))}
                                                disabled={users.current_page === users.last_page}
                                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                                            >
                                                <span className="sr-only">Next</span>
                                                <ChevronDown className="h-5 w-5 -rotate-90" />
                                            </button>
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
