import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { workerApiFunctions } from '../api/workerApiFunctions';

export function useWorkerProfiles() {

  const {
    data: workers,
    isLoading
  } = useQuery({
    queryKey:['workers-profile'],
    queryFn: () => workerApiFunctions.getWorkerProfiles()
  })

  return {
    workers,
    isLoading
  }
}

export function useWorkerProfile(userId: string) {
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading,
    error
  } = useQuery({
    queryKey: ['worker-profile', userId],
    queryFn: () => workerApiFunctions.getWorkerProfile(userId),
    enabled: !!userId
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => workerApiFunctions.updateWorkerProfile(userId, data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['worker-profile', userId], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast.success('Profil mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erreur lors de la mise à jour du profil');
    }
  });

  const getCommissionReport = (period?: string) => {
    return workerApiFunctions.getCommissionReport(userId, period);
  };

  const getPaymentHistory = () => {
    return workerApiFunctions.getPaymentHistory(userId);
  };

  const getEarningsStatement = (period?: string) => {
    return workerApiFunctions.getEarningsStatement(userId, period);
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
    getCommissionReport,
    getPaymentHistory,
    getEarningsStatement
  };
}