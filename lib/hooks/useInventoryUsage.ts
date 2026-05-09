import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventory';
import { toast } from 'sonner';

export function useInventoryUsage(params?: { itemId?: string; appointmentId?: string }) {
  return useQuery({
    queryKey: ['inventory', 'usage', params],
    queryFn: () => inventoryApi.getUsages(params),
    enabled: !!(params?.itemId || params?.appointmentId),
    staleTime: 2 * 60 * 1000,
  });
}

export function useItemUsageHistory(itemId: string, dateRange?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['inventory', itemId, 'usage-history', dateRange],
    queryFn: () => inventoryApi.getItemUsageHistory(itemId, dateRange),
    enabled: !!itemId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecordUsage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ appointmentId, items, workerId }: { 
      appointmentId: string; 
      items: { itemId: string; quantity: number; notes?: string }[];
      workerId?: string;
    }) => inventoryApi.recordUsage(appointmentId, items, workerId),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', variables.appointmentId] });
      
      toast.success('Utilisation des articles enregistrée');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erreur lors de l\'enregistrement');
    }
  });
}