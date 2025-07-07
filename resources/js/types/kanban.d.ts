import { User } from './app';

export interface KanbanBoard {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  is_active: boolean;
  settings: Record<string, unknown>;
  columns: KanbanColumn[];
  created_at: string;
  updated_at: string;
  creator?: User;
}

export interface KanbanColumn {
  id: number;
  board_id: number;
  name: string;
  color: string;
  position: number;
  is_default: boolean;
  settings: Record<string, unknown>;
  tasks: KanbanTask[];
  task_count?: number;
}

export interface KanbanTask {
  id: number;
  board_id: number;
  column_id: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: number;
  created_by: number;
  due_date?: string;
  position: number;
  tags: string[];
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  assigned_user?: User;
  created_user?: User;
}
