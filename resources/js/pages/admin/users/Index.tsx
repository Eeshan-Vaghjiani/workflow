import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { motion } from 'framer-motion';
import {
    Search,
    Plus,
    Edit,
    Trash,
    MoreHorizontal,
    Download,
    Filter,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { Card3D } from '@/components/ui/card-3d';

// Define interface for user data
interface User {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    created_at: string;
    last_login_at: string | null;
    groups_count: number;
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
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

    // Handle sort
    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Handle search
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // Handle checkbox selection
    const handleSelectUser = (userId: number) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectedUsers.length === filteredUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredUsers.map(user => user.id));
        }
    };

    // Toggle dropdown
    const toggleDropdown = (userId: number | null) => {
        setDropdownOpen(dropdownOpen === userId ? null : userId);
    };

    // Handle delete user
    const handleDeleteUser = (userId: number) => {
        if (confirmDelete === userId) {
            router.delete(route('admin.users.delete', { id: userId }), {
                onSuccess: () => {
                    setDropdownOpen(null);
                    setConfirmDelete(null);
                },
                preserveScroll: true,
            });
        } else {
            setConfirmDelete(userId);
            // Auto-reset confirmation after 5 seconds
            setTimeout(() => {
                setConfirmDelete(null);
            }, 5000);
        }
    };

    // Export users as CSV
    const exportUsers = () => {
        const csvHeader = ['ID', 'Name', 'Email', 'Role', 'Created At', 'Last Login', 'Groups'];
        let csvContent = csvHeader.join(',') + '\n';

        users.data.forEach(user => {
            const userValues = [
                user.id,
                `"${user.name}"`,
                `"${user.email}"`,
                user.is_admin ? 'ADMIN' : 'USER',
                new Date(user.created_at).toLocaleDateString(),
                user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never',
                user.groups_count,
            ];
            csvContent += userValues.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'users_data.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filter users based on search term
    const filteredUsers = users.data
        .filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            const aValue = String(a[sortField as keyof User] || '');
            const bValue = String(b[sortField as keyof User] || '');

            return sortDirection === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        });

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

                    <motion.a
                        href="/admin/users/create"
                        className="flex items-center justify-center px-4 py-2 bg-[#00887A] hover:bg-[#007A6C] text-white rounded-lg transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Add New User
                    </motion.a>
                </motion.div>

                {/* Filters and Search */}
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
                                    onClick={exportUsers}
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
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900/50">
                                    <tr>
                                        <th scope="col" className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            <div className="flex items-center">
                                                <input
                                                    id="checkbox-all"
                                                    type="checkbox"
                                                    className="w-4 h-4 text-[#00887A] bg-gray-100 border-gray-300 rounded focus:ring-[#00887A] dark:focus:ring-[#00ccb4] dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                                                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                                    onChange={handleSelectAll}
                                                />
                                            </div>
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                                            onClick={() => handleSort('name')}
                                        >
                                            <div className="flex items-center">
                                                Name
                                                {sortField === 'name' && (
                                                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                                            onClick={() => handleSort('email')}
                                        >
                                            <div className="flex items-center">
                                                Email
                                                {sortField === 'email' && (
                                                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                                            onClick={() => handleSort('is_admin')}
                                        >
                                            <div className="flex items-center">
                                                Role
                                                {sortField === 'is_admin' && (
                                                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                                            onClick={() => handleSort('created_at')}
                                        >
                                            <div className="flex items-center">
                                                Created
                                                {sortField === 'created_at' && (
                                                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                                            onClick={() => handleSort('last_login_at')}
                                        >
                                            <div className="flex items-center">
                                                Last Login
                                                {sortField === 'last_login_at' && (
                                                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th scope="col" className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 text-[#00887A] bg-gray-100 border-gray-300 rounded focus:ring-[#00887A] dark:focus:ring-[#00ccb4] dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                                                        checked={selectedUsers.includes(user.id)}
                                                        onChange={() => handleSelectUser(user.id)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <div className="text-sm text-gray-600 dark:text-gray-300">{user.email}</div>
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_admin
                                                    ? 'bg-[#D3E3FC] text-[#00887A] dark:bg-[#1e3a60] dark:text-[#00ccb4]'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {user.is_admin ? 'ADMIN' : 'USER'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                                    {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 relative">
                                                <div className="flex items-center space-x-3">
                                                    <button
                                                        className="text-gray-600 dark:text-gray-400 hover:text-[#00887A] dark:hover:text-[#00ccb4]"
                                                        onClick={() => router.visit(`/admin/users/${user.id}/edit`)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        className={`hover:text-red-600 ${confirmDelete === user.id ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'}`}
                                                        onClick={() => handleDeleteUser(user.id)}
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleDropdown(user.id)}
                                                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                {dropdownOpen === user.id && (
                                                    <div className="absolute right-0 z-10 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
                                                        <ul className="py-1">
                                                            <li>
                                                                <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                                    View Profile
                                                                </a>
                                                            </li>
                                                            <li>
                                                                <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                                    Reset Password
                                                                </a>
                                                            </li>
                                                            <li>
                                                                <a href="#" className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                                    Disable Account
                                                                </a>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}

                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-sm text-center text-gray-500 dark:text-gray-400">
                                                No users found matching your search criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
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
        </AdminLayout>
    );
}
