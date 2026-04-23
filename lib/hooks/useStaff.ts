import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { staffApi, CreateWorkerData, UpdateScheduleData, CreateWorkerResponse } from '../api/staff';
import { toast } from 'sonner';
import { commissionApi } from '../api/commission';

export function useStaff(params?: {
  role?: string;
  isAvailable?: boolean;
}) {
  const queryClient = useQueryClient();

  const {
    data: staff = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['staff', params],
    queryFn: () => staffApi.getStaff(params),
  });

  // Create worker
  const createMutation = useMutation({
    mutationFn: staffApi.createWorker,
    onSuccess: (data: CreateWorkerResponse) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success(data.message || 'Employé créé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
    },
  });

  return {
    staff,
    isLoading,
    error,
    refetch,
    createWorker: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}

export function useWorker(id: string) {
  return useQuery({
    queryKey: ['staff', id],
    queryFn: () => staffApi.getWorker(id),
    enabled: !!id,
  });
}

export function useWorkerSchedule(id: string, params?: {
  date?: string;
  week?: string;
}) {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
  } = useQuery({
    queryKey: ['staff', id, 'schedule', params],
    queryFn: () => staffApi.getWorkerSchedule(id, params),
    enabled: !!id,
  });

  // Update schedule
  const updateMutation = useMutation({
    mutationFn: (scheduleData: UpdateScheduleData) =>
      staffApi.updateWorkerSchedule(id, scheduleData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff', id, 'schedule'] });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erreur de mise à jour');
    },
  });

  return {
    schedule: data?.schedule || [],
    workingHours: data?.workingHours,
    isLoading,
    // Change mutate to mutateAsync so it returns a Promise
    updateSchedule: updateMutation.mutateAsync, 
    isUpdating: updateMutation.isPending,
  };
}

export function useWorkerCommission(id: string, period?: string) {
  return useQuery({
    queryKey: ['staff', id, 'commission', period],
    queryFn: () => staffApi.getWorkerCommission(id, period),
    enabled: !!id,
  });
}

export function useAvailableStaff(params?: {
  category?: string;
  date?: string;
  time?: string;
}) {

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff', 'available', params],
    queryFn: () => staffApi.getAvailableStaff(params),
  });

  return {
    staff,
    isLoading
  }
}

export function useCommission() {
  const queryClient = useQueryClient();

  const { data: commissions = [], isLoading, refetch } = useQuery({
    queryKey: ["commission"],
    queryFn: () => commissionApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: commissionApi.create,
    onSuccess: () => {
      toast.success("Commission générée");
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Erreur lors de la génération de la commission");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      commissionApi.update(id, status),
    onSuccess: () => toast.success("Statut mis à jour"),
    onError: (error) => toast.error(error.message)
  });

  return {
    commissions,
    isLoading,
    refetch,
    createCommission: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateCommission: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
