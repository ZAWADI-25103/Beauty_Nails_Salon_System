import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi, TasksParams } from '../api/tasks';
import { toast } from 'sonner';

export function useTasks(params?: TasksParams) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => tasksApi.getTasks(params),
  });
}

export function useTask(id?: string) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => tasksApi.getTask(id as string),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (payload: any) => tasksApi.createTask(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(data.message || 'Task created');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error creating task');
    },
  });

  return m;
}

export function useUpdateTask() {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => tasksApi.updateTask(id, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['tasks', data.task.id] });
      toast.success(data.message || 'Task updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error updating task');
    },
  });

  return m;
}

export function useAssignTask() {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: ({ id, workerId }: { id: string; workerId: string }) => tasksApi.assignTask(id, workerId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['tasks', data.task.id] });
      toast.success(data.message || 'Task assigned');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error assigning task');
    },
  });

  return m;
}

export function useDeleteTask() {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (id: string) => tasksApi.deleteTask(id),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(data.message || 'Task deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error deleting task');
    },
  });

  return m;
}
