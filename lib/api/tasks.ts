import axiosdb from '../axios';

export type TaskType = 'general' | 'client_followup' | 'inventory' | 'maintenance' | 'appointment' | 'admin';
export type TaskStatus = 'open' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToWorkerId?: string | null;
  assignedTo?: {
    id: string;
    user?: { id: string; name?: string; email?: string } | null;
  } | null;
  clientId?: string | null;
  client?: { id: string; user?: { id: string; name?: string; email?: string } | null } | null;
  appointmentId?: string | null;
  createdById?: string | null;
  createdBy?: { id: string; name?: string; email?: string } | null;
  dueAt?: string | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  metadata?: any;
  isPrivate?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TasksParams {
  search?: string;
  status?: TaskStatus;
  type?: TaskType;
  assignedTo?: string;
  page?: number;
  limit?: number;
}

export const tasksApi = {
  getTasks: async (params?: TasksParams): Promise<{ tasks: Task[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const { data } = await axiosdb.get('/tasks', { params });
    return data;
  },

  getTask: async (id: string): Promise<Task> => {
    const { data } = await axiosdb.get(`/tasks/${id}`);
    return data;
  },

  createTask: async (payload: any): Promise<{ task: Task; message: string }> => {
    const { data } = await axiosdb.post('/tasks', payload);
    return data;
  },

  updateTask: async (id: string, payload: any): Promise<{ task: Task; message: string }> => {
    const { data } = await axiosdb.patch(`/tasks/${id}`, payload);
    return data;
  },

  deleteTask: async (id: string): Promise<{ message: string }> => {
    const { data } = await axiosdb.delete(`/tasks/${id}`);
    return data;
  },

  assignTask: async (id: string, workerId: string) : Promise<{ task: Task; message: string }> => {
    const { data } = await axiosdb.patch(`/tasks/${id}`, { assignedToWorkerId: workerId });
    return data;
  }
};
