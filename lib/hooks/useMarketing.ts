import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { marketingApi, MarketingCampaign, DiscountCode } from '../api/marketing';
import { toast } from 'sonner';

export function useCampaigns() {
  const queryClient = useQueryClient();

  const { data: campaigns = [], isLoading, error } = useQuery({
    queryKey: ['campaigns'],
    queryFn: marketingApi.getCampaigns,
  });

  const createMutation = useMutation({
    mutationFn: marketingApi.createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campagne créée avec succès');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Erreur lors de la création'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MarketingCampaign> }) =>
      marketingApi.updateCampaign(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campagne mise à jour');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Erreur lors de la mise à jour'),
  });

  const deleteMutation = useMutation({
    mutationFn: marketingApi.deleteCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campagne supprimée');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Erreur lors de la suppression'),
  });

  const sendMutation = useMutation({
    mutationFn: marketingApi.sendCampaign,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(data.message);
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Erreur lors de l\'envoi'),
  });

  return {
    campaigns,
    isLoading,
    error,
    createCampaign: createMutation.mutate,
    updateCampaign: updateMutation.mutate,
    deleteCampaign: deleteMutation.mutate,
    sendCampaign: sendMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSending: sendMutation.isPending,
  };
}

export function useDiscounts() {
  const queryClient = useQueryClient();

  const { data: discounts = [], isLoading, error } = useQuery({
    queryKey: ['discounts'],
    queryFn: marketingApi.getDiscounts,
  });

  const createMutation = useMutation({
    mutationFn: marketingApi.createDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success('Code promo créé avec succès');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Erreur lors de la création'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DiscountCode> }) =>
      marketingApi.updateDiscount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success('Code promo mis à jour');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Erreur lors de la mise à jour'),
  });

  const deleteMutation = useMutation({
    mutationFn: marketingApi.deleteDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success('Code promo supprimé');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Erreur lors de la suppression'),
  });

  return {
    discounts,
    isLoading,
    error,
    createDiscount: createMutation.mutate,
    updateDiscount: updateMutation.mutate,
    deleteDiscount: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
