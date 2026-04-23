import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { membershipsApi, Membership, MembershipPurchase } from '../api/memberships';
import { toast } from 'sonner';

export function useMemberships() {
  const queryClient = useQueryClient();

  const { data: memberships = [], isLoading, error } = useQuery({
    queryKey: ['memberships'],
    queryFn: membershipsApi.getMemberships,
  });

  const createMutation = useMutation({
    mutationFn: membershipsApi.createMembership,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      toast.success('Abonnement créé avec succès');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Erreur lors de la création'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Membership> }) =>
      membershipsApi.updateMembership(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      toast.success('Abonnement mis à jour');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Erreur lors de la mise à jour'),
  });

  const deleteMutation = useMutation({
    mutationFn: membershipsApi.deleteMembership,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      toast.success('Abonnement supprimé');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Erreur lors de la suppression'),
  });

  return {
    memberships,
    isLoading,
    error,
    createMembership: createMutation.mutate,
    updateMembership: updateMutation.mutate,
    deleteMembership: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useMembershipPurchases(params?: { clientId?: string, membershipId?: string }) {
  const queryClient = useQueryClient();

  const { data: purchases = [], isLoading, error } = useQuery({
    queryKey: ['membership-purchases', params],
    queryFn: () => membershipsApi.getPurchases(params),
  });

  const purchaseMutation = useMutation({
    mutationFn: membershipsApi.purchaseMembership,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Abonnement acheté avec succès');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Erreur lors de l\'achat'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MembershipPurchase> }) =>
      membershipsApi.updatePurchase(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-purchases'] });
      toast.success('Achat d\'abonnement mis à jour');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Erreur lors de la mise à jour'),
  });

  return {
    purchases,
    isLoading,
    error,
    purchaseMembership: purchaseMutation.mutate,
    updatePurchase: updateMutation.mutate,
    isPurchasing: purchaseMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
