import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { transfersApi } from '../api/transfers';

export function usePendingTransfers() {
  return useQuery({
    queryKey: ['transfers', 'pending'],
    queryFn: () => transfersApi.getPendingTransfers(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000, // Auto-refetch every 30 seconds
  });
}

export function useRespondToTransfer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ transferId, action, notes }: { 
      transferId: string; 
      action: 'accept' | 'reject'; 
      notes?: string 
    }) => transfersApi.respondToTransfer(transferId, action, notes),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['transfers', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      toast.success(
        variables.action === 'accept' 
          ? '✓ Transfert accepté - Rendez-vous ajouté à votre planning' 
          : '✗ Transfert refusé'
      );
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erreur lors du traitement du transfert');
    }
  });
}