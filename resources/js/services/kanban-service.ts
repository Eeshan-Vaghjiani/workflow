import axios from 'axios';
import { KanbanBoard, KanbanColumn, KanbanTask } from '@/types/kanban';

/**
 * Service for managing Kanban boards, columns, and tasks
 * Uses axios for API requests with proper authentication
 */
export const KanbanService = {
  // Check authentication status
  checkAuth: async (): Promise<{ 
    authenticated: boolean; 
    user?: { 
      id: number; 
      name: string; 
      email: string; 
      is_admin?: boolean 
    };
    error?: string;
  }> => {
    try {
      const response = await axios.get('/auth/status');
      return response.data;
    } catch {
      return {
        authenticated: false,
        error: 'Authentication check failed'
      };
    }
  },

  // Board API calls
  getBoards: async (): Promise<KanbanBoard[]> => {
    try {
      // Refresh CSRF token before making request
      await axios.get('/sanctum/csrf-cookie', { withCredentials: true });

      // Get CSRF token from meta tag
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      
      // Set headers for request
      const headers = {
        'X-CSRF-TOKEN': csrfToken || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      };

      // Make request to API
      const response = await axios.get('/api/direct/kanban/boards', {
        headers,
        withCredentials: true
      });
      
      return response.data.data || response.data;
    } catch {
      // If API call fails, return empty array instead of throwing error
      return [];
    }
  },

  getBoard: async (id: number): Promise<KanbanBoard> => {
    const response = await axios.get(`/api/direct/kanban/boards/${id}`);
    return response.data.data || response.data;
  },

  createBoard: async (data: Partial<KanbanBoard>): Promise<KanbanBoard> => {
    // Refresh CSRF token before making request
    await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
    
    const response = await axios.post('/api/direct/kanban/boards', data);
    return response.data.data || response.data;
  },

  updateBoard: async (id: number, data: Partial<KanbanBoard>): Promise<KanbanBoard> => {
    // Refresh CSRF token before making request
    await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
    
    const response = await axios.put(`/api/direct/kanban/boards/${id}`, data);
    return response.data.data || response.data;
  },

  deleteBoard: async (id: number): Promise<void> => {
    // Refresh CSRF token before making request
    await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
    
    await axios.delete(`/api/direct/kanban/boards/${id}`);
  },

  // Column API calls
  createColumn: async (data: Partial<KanbanColumn>): Promise<KanbanColumn> => {
    // Refresh CSRF token before making request
    await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
    
    const response = await axios.post('/api/direct/kanban/columns', data);
    return response.data.data || response.data;
  },

  updateColumn: async (id: number, data: Partial<KanbanColumn>): Promise<KanbanColumn> => {
    // Refresh CSRF token before making request
    await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
    
    const response = await axios.put(`/api/direct/kanban/columns/${id}`, data);
    return response.data.data || response.data;
  },

  deleteColumn: async (id: number): Promise<void> => {
    // Refresh CSRF token before making request
    await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
    
    await axios.delete(`/api/direct/kanban/columns/${id}`);
  },

  // Task API calls
  createTask: async (data: Partial<KanbanTask>): Promise<KanbanTask> => {
    // Refresh CSRF token before making request
    await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
    
    const response = await axios.post('/api/direct/kanban/tasks', data);
    return response.data.data || response.data;
  },

  updateTask: async (id: number, data: Partial<KanbanTask>): Promise<KanbanTask> => {
    // Refresh CSRF token before making request
    await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
    
    const response = await axios.put(`/api/direct/kanban/tasks/${id}`, data);
    return response.data.data || response.data;
  },

  deleteTask: async (id: number): Promise<void> => {
    // Refresh CSRF token before making request
    await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
    
    await axios.delete(`/api/direct/kanban/tasks/${id}`);
  },

  moveTask: async (taskId: number, columnId: number, position: number): Promise<KanbanTask> => {
    // Refresh CSRF token before making request
    await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
    
    const response = await axios.post(`/api/direct/kanban/tasks/${taskId}/move`, {
      column_id: columnId,
      position,
    });
    return response.data.data || response.data;
  },
};
