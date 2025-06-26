import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { motion } from 'framer-motion';
import {
    Users,
    UserPlus,
    Search,
    MoreHorizontal,
    Edit3,
    Trash2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
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

// Define types for the data
interface Group {
    id: number;
    name: string;
    description: string;
    members_count: number;
    created_at: string;
    owner: {
        id: number;
        name: string;
    };
    deleted_at: string | null;
}

interface GroupsProps {
    groups: {
        data: Group[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function Groups({ groups }: GroupsProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);

    // Filter groups based on search query (client-side filtering)
    const filteredGroups = searchQuery === ''
        ? groups.data
        : groups.data.filter(group =>
            group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );

    // Handle dropdown toggle
    const toggleDropdown = (id: number) => {
        setDropdownOpen(dropdownOpen === id ? null : id);
    };

    // Handle edit group
    const handleEdit = (id: number) => {
        // In a real app, this would navigate to an edit page
        alert(`Edit group with ID: ${id}`);
        setDropdownOpen(null);
    };

    // Handle delete group
    const handleDelete = (id: number) => {
        if (confirm(`Are you sure you want to delete this group?`)) {
            router.delete(route('admin.groups.delete', { id }), {
                onSuccess: () => {
                    // The page will refresh with updated data
                }
            });
        }
        setDropdownOpen(null);
    };

    // Handle creating a new group
    const handleCreateGroup = () => {
        // Navigate to create new group page
        router.visit(route('groups.create'));
    };

    // Handle pagination
    const goToPage = (page: number) => {
        router.get(route('admin.groups.index', { page }));
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <AdminLayout>
            <Head title="Admin Groups" />

            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Groups Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage user groups and their access</p>
                </div>

                <button
                    onClick={handleCreateGroup}
                    className="px-4 py-2 bg-[#00887A] hover:bg-[#007a6c] text-white rounded-md transition-colors flex items-center"
                >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Group
                </button>
            </div>

            <motion.div
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Search and Filter */}
                <motion.div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
                    variants={itemVariants}
                >
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-[#00887A] focus:border-[#00887A]"
                            placeholder="Search groups by name or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </motion.div>

                {/* Groups Table */}
                <motion.div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700"
                    variants={itemVariants}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700 text-left">
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Owner
                                    </th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Members
                                    </th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredGroups.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                            No groups found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredGroups.map((group) => (
                                        <tr
                                            key={group.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 rounded-full bg-[#D3E3FC] dark:bg-[#1e3a60] flex items-center justify-center text-[#00887A] dark:text-[#00ccb4] mr-3">
                                                        <Users className="h-4 w-4" />
                                                    </div>
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {group.name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {group.description || 'No description'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-gray-300">
                                                    {group.owner ? group.owner.name : 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-gray-300">
                                                    {group.members_count}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {formatDate(group.created_at)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${!group.deleted_at
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {!group.deleted_at ? 'Active' : 'Deleted'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="relative">
                                                    <button
                                                        onClick={() => toggleDropdown(group.id)}
                                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                                                    >
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </button>

                                                    {dropdownOpen === group.id && (
                                                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                                                            <div className="py-1">
                                                                <button
                                                                    onClick={() => handleEdit(group.id)}
                                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                                                                >
                                                                    <Edit3 className="h-4 w-4 mr-2" />
                                                                    Edit Group
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(group.id)}
                                                                    className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Delete Group
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-600 sm:px-6">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    Showing <span className="font-medium">{(groups.current_page - 1) * groups.per_page + 1}</span> to{' '}
                                    <span className="font-medium">
                                        {Math.min(groups.current_page * groups.per_page, groups.total)}
                                    </span> of{' '}
                                    <span className="font-medium">{groups.total}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        disabled={groups.current_page === 1}
                                        onClick={() => goToPage(groups.current_page - 1)}
                                    >
                                        <span className="sr-only">Previous</span>
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>

                                    {[...Array(groups.last_page)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => goToPage(i + 1)}
                                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium
                                                ${groups.current_page === i + 1
                                                    ? 'text-[#00887A] dark:text-[#00ccb4] bg-gray-50 dark:bg-gray-700'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}

                                    <button
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        disabled={groups.current_page === groups.last_page}
                                        onClick={() => goToPage(groups.current_page + 1)}
                                    >
                                        <span className="sr-only">Next</span>
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AdminLayout>
    );
}
