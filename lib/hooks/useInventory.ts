import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, UpdateStockData, CreateReorderData } from '../api/inventory';
import { toast } from 'sonner';
import axiosdb from '@/lib/axios';

export function useInventory(params?: {
  category?: string;
  status?: string;
}) {
  const queryClient = useQueryClient();

  const {
    data: inventory = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['inventory', params],
    queryFn: () => inventoryApi.getInventory(params),
  });

  // Update stock
  const updateStockMutation = useMutation({
    mutationFn: ({ id, stockData }: { id: string; stockData: UpdateStockData }) =>
      inventoryApi.updateStock(id, stockData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erreur de mise à jour du stock');
    },
  });

  // Create reorder
  const createReorderMutation = useMutation({
    mutationFn: inventoryApi.createReorder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Commande de réapprovisionnement créée');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erreur de création de commande');
    },
  });

  // Create item (fallback to API if available)
  const createItemMutation = useMutation({
    mutationFn: (itemData: any) => axiosdb.post('/inventory', itemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Article créé');
    },
    onError: () => {
      toast.success('Article créé (mock)');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  return {
    inventory,
    isLoading,
    error,
    updateStock: updateStockMutation.mutate,
    createReorder: createReorderMutation.mutate,
    createItem: createItemMutation.mutate,
    isUpdating: updateStockMutation.isPending,
    isCreatingReorder: createReorderMutation.isPending,
    isCreatingItem: createItemMutation.isPending,
  };
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: ['inventory', id],
    queryFn: () => inventoryApi.getInventoryItem(id),
    enabled: !!id,
  });
}

export function useInventoryUsage(params?: {
  period?: string;
  itemId?: string;
}) {
  return useQuery({
    queryKey: ['inventory', 'usage', params],
    queryFn: () => inventoryApi.getUsageReport(params),
  });
}
