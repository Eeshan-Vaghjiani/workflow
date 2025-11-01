import axios from 'axios';

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'ADMIN' | 'USER';
    created_at: string;
    last_login_at: string | null;
    deleted: boolean;
    groups_count: number;
}

export interface UserFormData {
    name: string;
    email: string;
    password?: string;
    is_admin: boolean;
}

export interface PaginatedUsers {
    users: User[];
    meta: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
}

export interface UserFilters {
    search?: string;
    role?: 'admin' | 'user';
    status?: 'active' | 'deleted';
    sort_field?: string;
    sort_direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
}

const API_URL = '/api/admin';

export const userService = {
    /**
     * Get users with pagination and filters
     */
    getUsers: async (filters: UserFilters = {}): Promise<PaginatedUsers> => {
        const response = await axios.get(`${API_URL}/users`, { params: filters });
        return response.data;
    },

    /**
     * Create a new user
     */
    createUser: async (userData: UserFormData): Promise<User> => {
        const response = await axios.post(`${API_URL}/users`, userData);
        return response.data.user;
    },

    /**
     * Update an existing user
     */
    updateUser: async (id: number, userData: UserFormData): Promise<User> => {
        const response = await axios.put(`${API_URL}/users/${id}`, userData);
        return response.data.user;
    },

    /**
     * Delete a user
     */
    deleteUser: async (id: number): Promise<void> => {
        await axios.delete(`${API_URL}/users/${id}`);
    },

    /**
     * Restore a deleted user
     */
    restoreUser: async (id: number): Promise<void> => {
        await axios.post(`${API_URL}/users/${id}/restore`);
    },

    /**
     * Download users PDF report
     */
    downloadPdf: async (): Promise<void> => {
        const response = await axios.get(`${API_URL}/users/pdf`, {
            responseType: 'blob'
        });

        // Create a blob URL and trigger download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `users-report-${new Date().toISOString().split('T')[0]}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }
};
