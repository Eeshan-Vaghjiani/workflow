import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    Search,
    Plus,
    Edit,
    Download,
    Filter,
    RefreshCw,
    Trash2,
    Users,
    UserPlus,
    UserCheck,
    UserX
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/ui/stat-card';
import { userService, type User, type UserFilters } from '@/services/userService';
import { useTheme } from '@/contexts/ThemeContext';
import UserFormModal from './UserFormModal';

export default function UserManagement() {
    const { theme } = useTheme();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({
        total: 0,
        perPage: 10,
        currentPage: 1,
        lastPage: 1
    });
    const [filters, setFilters] = useState<UserFilters>({
        search: '',
        sort_field: 'created_at',
        sort_direction: 'desc',
        page: 1,
        per_page: 10
    });
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        adminUsers: 0,
        deletedUsers: 0
    });
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Fetch users based on filters
    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await userService.getUsers(filters);
            setUsers(response.users);
            setPagination(response.meta);

            // Calculate stats
            const totalUsers = response.meta.total;
            const activeUsers = response.users.filter(user => !user.deleted).length;
            const adminUsers = response.users.filter(user => user.role === 'ADMIN').length;
            const deletedUsers = response.users.filter(user => user.deleted).length;

            setStats({
                totalUsers,
                activeUsers,
                adminUsers,
                deletedUsers
            });
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchUsers();
    }, [filters]);

    // Handle search
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFilters(prev => ({ ...prev, search: value, page: 1 }));
    };

    // Handle sort
    const handleSort = (field: string, direction: 'asc' | 'desc') => {
        setFilters(prev => ({
            ...prev,
            sort_field: field,
            sort_direction: direction
        }));
    };

    // Handle pagination
    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    // Handle delete user
    const handleDeleteUser = async (user: User) => {
        if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
            try {
                await userService.deleteUser(user.id);
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    // Handle restore user
    const handleRestoreUser = async (user: User) => {
        if (window.confirm(`Are you sure you want to restore ${user.name}?`)) {
            try {
                await userService.restoreUser(user.id);
                fetchUsers();
            } catch (error) {
                console.error('Error restoring user:', error);
            }
        }
    };

    // Handle edit user
    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setIsEditUserOpen(true);
    };

    // Handle create/update user success
    const handleUserFormSuccess = () => {
        setIsAddUserOpen(false);
        setIsEditUserOpen(false);
        setSelectedUser(null);
        fetchUsers();
    };

    // Handle export PDF
    const handleExportPdf = async () => {
        try {
            await userService.downloadPdf();
        } catch (error) {
            console.error('Error downloading PDF:', error);
        }
    };

    // Table columns
    const columns = [
        {
            id: 'name',
            header: 'Name',
            accessorKey: 'name',
            sortable: true
        },
        {
            id: 'email',
            header: 'Email',
            accessorKey: 'email',
            sortable: true
        },
        {
            id: 'role',
            header: 'Role',
            cell: (user: User) => (
                <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                    {user.role}
                </Badge>
            ),
            sortable: false
        },
        {
            id: 'created_at',
            header: 'Created',
            cell: (user: User) => new Date(user.created_at).toLocaleDateString(),
            sortable: true
        },
        {
            id: 'last_login_at',
            header: 'Last Login',
            cell: (user: User) => user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never',
            sortable: true
        },
        {
            id: 'status',
            header: 'Status',
            cell: (user: User) => (
                <Badge variant={user.deleted ? 'danger' : 'success'}>
                    {user.deleted ? 'Deleted' : 'Active'}
                </Badge>
            ),
            sortable: false
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: (user: User) => (
                <div className="flex items-center gap-2">
                    {!user.deleted ? (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditUser(user);
                                }}
                            >
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteUser(user);
                                }}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRestoreUser(user);
                            }}
                        >
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            ),
            sortable: false
        }
    ];

    return (
        <AdminLayout>
            <Head title="User Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage user accounts and permissions</p>
                    </div>

                    <Button
                        leftIcon={<Plus className="h-5 w-5" />}
                        onClick={() => setIsAddUserOpen(true)}
                    >
                        Add New User
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Users"
                        value={stats.totalUsers}
                        icon={<Users className="h-5 w-5 text-[#00887A] dark:text-[#00ccb4]" />}
                    />
                    <StatCard
                        title="Active Users"
                        value={stats.activeUsers}
                        icon={<UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />}
                    />
                    <StatCard
                        title="Admin Users"
                        value={stats.adminUsers}
                        icon={<UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                    />
                    <StatCard
                        title="Deleted Users"
                        value={stats.deletedUsers}
                        icon={<UserX className="h-5 w-5 text-red-600 dark:text-red-400" />}
                    />
                </div>

                {/* Filters and Search */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative flex-1">
                                <Input
                                    type="search"
                                    placeholder="Search users..."
                                    value={filters.search}
                                    onChange={handleSearch}
                                    leftIcon={<Search className="h-4 w-4" />}
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    variant="secondary"
                                    leftIcon={<Filter className="h-4 w-4" />}
                                >
                                    Filter
                                </Button>

                                <Button
                                    variant="secondary"
                                    leftIcon={<Download className="h-4 w-4" />}
                                    onClick={handleExportPdf}
                                >
                                    Export PDF
                                </Button>

                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={() => fetchUsers()}
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={users}
                            columns={columns}
                            isLoading={isLoading}
                            sortField={filters.sort_field}
                            sortDirection={filters.sort_direction}
                            onSort={handleSort}
                            rowClassName={(user) => user.deleted ? 'opacity-60' : ''}
                        />

                        {/* Pagination */}
                        {pagination.lastPage > 1 && (
                            <div className="flex justify-between items-center mt-4 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                                <div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        Showing <span className="font-medium">{(pagination.currentPage - 1) * pagination.perPage + 1}</span> to <span className="font-medium">{Math.min(pagination.currentPage * pagination.perPage, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> results
                                    </p>
                                </div>
                                <div className="flex space-x-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage === 1}
                                    >
                                        Previous
                                    </Button>

                                    {Array.from({ length: pagination.lastPage }, (_, i) => i + 1)
                                        .filter(page => {
                                            const currentPage = pagination.currentPage;
                                            return page === 1 ||
                                                page === pagination.lastPage ||
                                                (page >= currentPage - 1 && page <= currentPage + 1);
                                        })
                                        .map((page, index, array) => {
                                            // Add ellipsis
                                            if (index > 0 && page - array[index - 1] > 1) {
                                                return (
                                                    <React.Fragment key={`ellipsis-${page}`}>
                                                        <Button variant="outline" size="sm" disabled>
                                                            ...
                                                        </Button>
                                                        <Button
                                                            variant={pagination.currentPage === page ? 'primary' : 'outline'}
                                                            size="sm"
                                                            onClick={() => handlePageChange(page)}
                                                        >
                                                            {page}
                                                        </Button>
                                                    </React.Fragment>
                                                );
                                            }

                                            return (
                                                <Button
                                                    key={page}
                                                    variant={pagination.currentPage === page ? 'primary' : 'outline'}
                                                    size="sm"
                                                    onClick={() => handlePageChange(page)}
                                                >
                                                    {page}
                                                </Button>
                                            );
                                        })}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                                        disabled={pagination.currentPage === pagination.lastPage}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* User Form Modals */}
            <UserFormModal
                isOpen={isAddUserOpen}
                onClose={() => setIsAddUserOpen(false)}
                onSuccess={handleUserFormSuccess}
            />

            <UserFormModal
                isOpen={isEditUserOpen}
                onClose={() => {
                    setIsEditUserOpen(false);
                    setSelectedUser(null);
                }}
                onSuccess={handleUserFormSuccess}
                user={selectedUser}
            />
        </AdminLayout>
    );
}
