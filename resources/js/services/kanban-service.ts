import axios from 'axios';
import { KanbanBoard, KanbanColumn, KanbanTask } from '@/types/kanban';

export const KanbanService = {
  // Board API calls
  getBoards: async (): Promise<KanbanBoard[]> => {
    const response = await axios.get('/api/kanban/boards', {
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      withCredentials: true
    });
    return response.data;
  },

  getBoard: async (id: number): Promise<KanbanBoard> => {
    const response = await axios.get(`/api/kanban/boards/${id}`, {
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      withCredentials: true
    });
    return response.data;
  },

  createBoard: async (data: Partial<KanbanBoard>): Promise<KanbanBoard> => {
    const response = await axios.post('/api/kanban/boards', data, {
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      withCredentials: true
    });
    return response.data;
  },

  updateBoard: async (id: number, data: Partial<KanbanBoard>): Promise<KanbanBoard> => {
    const response = await axios.put(`/api/kanban/boards/${id}`, data, {
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      withCredentials: true
    });
    return response.data;
  },

  deleteBoard: async (id: number): Promise<void> => {
    await axios.delete(`/api/kanban/boards/${id}`, {
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      withCredentials: true
    });
  },

  // Column API calls
  createColumn: async (data: Partial<KanbanColumn>): Promise<KanbanColumn> => {
    const response = await axios.post('/api/kanban/columns', data, {
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      withCredentials: true
    });
    return response.data;
  },

  updateColumn: async (id: number, data: Partial<KanbanColumn>): Promise<KanbanColumn> => {
    const response = await axios.put(`/api/kanban/columns/${id}`, data, {
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      withCredentials: true
    });
    return response.data;
  },

  deleteColumn: async (id: number): Promise<void> => {
    await axios.delete(`/api/kanban/columns/${id}`, {
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      withCredentials: true
    });
  },

  reorderColumns: async (boardId: number, columnIds: number[]): Promise<void> => {
    await axios.put('/api/kanban/columns/reorder', { board_id: boardId, column_ids: columnIds }, {
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      withCredentials: true
    });
  },

  // Task API calls
  createTask: async (data: Partial<KanbanTask>): Promise<KanbanTask> => {
    const response = await axios.post('/api/kanban/tasks', data, {
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      withCredentials: true
    });
    return response.data;
  },

  updateTask: async (id: number, data: Partial<KanbanTask>): Promise<KanbanTask> => {
    const response = await axios.put(`/api/kanban/tasks/${id}`, data, {
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      withCredentials: true
    });
    return response.data;
  },

  deleteTask: async (id: number): Promise<void> => {
    await axios.delete(`/api/kanban/tasks/${id}`, {
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      withCredentials: true
    });
  },

  moveTask: async (taskId: number, columnId: number, position: number): Promise<KanbanTask> => {
    const response = await axios.put('/api/kanban/tasks/move', {
      task_id: taskId,
      column_id: columnId,
      position: position
    }, {
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      withCredentials: true
    });
    return response.data;
  },

  reorderTasks: async (columnId: number, taskIds: number[]): Promise<void> => {
    await axios.put('/api/kanban/tasks/reorder', {
      column_id: columnId,
      tasks: taskIds.map((id, index) => ({ id, position: index }))
    }, {
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      withCredentials: true
    });
  }
};
