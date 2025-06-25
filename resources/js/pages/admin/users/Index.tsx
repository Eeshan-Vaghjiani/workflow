import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
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
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};

// Mock user data
const users = [
    {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'ADMIN',
        status: 'active',
        createdAt: '2023-06-15'
    },
    {
        id: 2,
        name: 'Sarah Smith',
        email: 'sarah@example.com',
        role: 'USER',
        status: 'active',
        createdAt: '2023-07-22'
    },
    {
        id: 3,
        name: 'Michael Johnson',
        email: 'michael@example.com',
        role: 'USER',
        status: 'inactive',
        createdAt: '2023-08-10'
    },
    {
        id: 4,
        name: 'Emily Brown',
        email: 'emily@example.com',
        role: 'USER',
        status: 'active',
        createdAt: '2023-09-05'
    },
    {
        id: 5,
        name: 'David Wilson',
        email: 'david@example.com',
        role: 'ADMIN',
        status: 'active',
        createdAt: '2023-10-18'
    },
    {
        id: 6,
        name: 'Jessica Taylor',
        email: 'jessica@example.com',
        role: 'USER',
        status: 'inactive',
        createdAt: '2023-11-02'
    },
    {
        id: 7,
        name: 'Daniel Martinez',
        email: 'daniel@example.com',
        role: 'USER',
        status: 'active',
        createdAt: '2023-12-14'
    },
    {
        id: 8,
        name: 'Sophia Anderson',
        email: 'sophia@example.com',
        role: 'USER',
        status: 'active',
        createdAt: '2024-01-20'
    },
    {
        id: 9,
        name: 'Matthew Thomas',
        email: 'matthew@example.com',
        role: 'USER',
        status: 'inactive',
        createdAt: '2024-02-08'
    },
    {
        id: 10,
        name: 'Olivia Jackson',
        email: 'olivia@example.com',
        role: 'ADMIN',
        status: 'active',
        createdAt: '2024-03-17'
    }
];

export default function UsersIndex() {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);

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

    // Filter and sort users
    const filteredUsers = users
        .filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            const fieldA = a[sortField as keyof typeof a];
            const fieldB = b[sortField as keyof typeof b];

            if (typeof fieldA === 'string' && typeof fieldB === 'string') {
                return sortDirection === 'asc'
                    ? fieldA.localeCompare(fieldB)
                    : fieldB.localeCompare(fieldA);
            }

            return 0;
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
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
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

                        <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </button>

                        <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                            <RefreshCw className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>

                {/* Selected Actions */}
                {selectedUsers.length > 0 && (
                    <motion.div
                        variants={itemVariants}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-[#D3E3FC] dark:bg-[#1e3a60] p-4 rounded-lg shadow-sm border border-[#77A6F7] dark:border-[#2a4d7d] flex items-center justify-between"
                    >
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                        </span>

                        <div className="flex items-center gap-2">
                            <button className="px-3 py-1.5 text-sm font-medium text-[#00887A] dark:text-[#00ccb4] bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                Export Selected
                            </button>
                            <button className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
                                Delete Selected
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Users Table */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="p-4">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-[#00887A] dark:text-[#00ccb4] rounded border-gray-300 dark:border-gray-600 focus:ring-[#00887A] dark:focus:ring-[#00ccb4]"
                                                checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 cursor-pointer"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center">
                                            Name
                                            {sortField === 'name' && (
                                                sortDirection === 'asc' ?
                                                    <ChevronUp className="ml-1 h-4 w-4" /> :
                                                    <ChevronDown className="ml-1 h-4 w-4" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 cursor-pointer"
                                        onClick={() => handleSort('email')}
                                    >
                                        <div className="flex items-center">
                                            Email
                                            {sortField === 'email' && (
                                                sortDirection === 'asc' ?
                                                    <ChevronUp className="ml-1 h-4 w-4" /> :
                                                    <ChevronDown className="ml-1 h-4 w-4" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 cursor-pointer"
                                        onClick={() => handleSort('role')}
                                    >
                                        <div className="flex items-center">
                                            Role
                                            {sortField === 'role' && (
                                                sortDirection === 'asc' ?
                                                    <ChevronUp className="ml-1 h-4 w-4" /> :
                                                    <ChevronDown className="ml-1 h-4 w-4" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 cursor-pointer"
                                        onClick={() => handleSort('status')}
                                    >
                                        <div className="flex items-center">
                                            Status
                                            {sortField === 'status' && (
                                                sortDirection === 'asc' ?
                                                    <ChevronUp className="ml-1 h-4 w-4" /> :
                                                    <ChevronDown className="ml-1 h-4 w-4" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 cursor-pointer"
                                        onClick={() => handleSort('createdAt')}
                                    >
                                        <div className="flex items-center">
                                            Created Date
                                            {sortField === 'createdAt' && (
                                                sortDirection === 'asc' ?
                                                    <ChevronUp className="ml-1 h-4 w-4" /> :
                                                    <ChevronDown className="ml-1 h-4 w-4" />
                                            )}
                                        </div>
                                    </th>
                                    <th scope="col" className="px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user, index) => (
                                    <motion.tr
                                        key={user.id}
                                        className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        variants={itemVariants}
                                        custom={index}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ backgroundColor: 'rgba(211, 227, 252, 0.2)' }}
                                    >
                                        <td className="w-4 p-4">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-[#00887A] dark:text-[#00ccb4] rounded border-gray-300 dark:border-gray-600 focus:ring-[#00887A] dark:focus:ring-[#00ccb4]"
                                                    checked={selectedUsers.includes(user.id)}
                                                    onChange={() => handleSelectUser(user.id)}
                                                />
                                            </div>
                                        </td>
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                            {user.name}
                                        </th>
                                        <td className="px-6 py-4">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === 'ADMIN'
                                                    ? 'bg-[#00887A]/20 text-[#00887A] dark:bg-[#00887A]/30 dark:text-[#00ccb4]'
                                                    : 'bg-[#77A6F7]/20 text-[#77A6F7] dark:bg-[#77A6F7]/30'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                {user.status === 'active' ? (
                                                    <>
                                                        <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></div>
                                                        <span>Active</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="h-2.5 w-2.5 rounded-full bg-gray-400 mr-2"></div>
                                                        <span>Inactive</span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.createdAt}
                                        </td>
                                        <td className="px-6 py-4 text-right relative">
                                            <button
                                                onClick={() => toggleDropdown(user.id)}
                                                className="font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                            >
                                                <MoreHorizontal className="h-5 w-5" />
                                            </button>

                                            {dropdownOpen === user.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ duration: 0.1 }}
                                                    className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                                                >
                                                    <a
                                                        href={`/admin/users/${user.id}/edit`}
                                                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    >
                                                        <Edit className="mr-3 h-4 w-4" />
                                                        Edit
                                                    </a>
                                                    <a
                                                        href="#"
                                                        className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    >
                                                        <Trash className="mr-3 h-4 w-4" />
                                                        Delete
                                                    </a>
                                                    <a
                                                        href="#"
                                                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    >
                                                        {user.status === 'active' ? (
                                                            <>
                                                                <XCircle className="mr-3 h-4 w-4" />
                                                                Deactivate
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="mr-3 h-4 w-4" />
                                                                Activate
                                                            </>
                                                        )}
                                                    </a>
                                                </motion.div>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}

                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                            No users found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Showing <span className="font-medium">{filteredUsers.length}</span> of <span className="font-medium">{users.length}</span> users
                        </div>

                        <div className="flex items-center space-x-2">
                            <button className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                Previous
                            </button>
                            <button className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                Next
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AdminLayout>
    );
}
