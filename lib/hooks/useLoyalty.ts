import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loyaltyApi } from '../api/loyalty';
import { toast } from 'sonner';

export function useLoyaltyTransactions() {

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['transactions'],
    queryFn: loyaltyApi.getAllLoyaltyPoints,
  });
  return {
    isLoading,
    error,
    transactions : data?.transactions || []
  }
}
export function useLoyalty() {
  const queryClient = useQueryClient();
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['loyalty', 'points'],
    queryFn: loyaltyApi.getLoyaltyPoints,
  });

  const applyLoyaltyBonusMutation = useMutation({
    mutationFn: loyaltyApi.applyLoyaltyBonus,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loyalty'] });
      // toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Bonus de parrainage pas accorder');
    },
  });
  const applyFreeServiceMutation = useMutation({
    mutationFn: loyaltyApi.applyFreeService,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['free_service'] });
      // toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Bonus de parrainage pas accorder');
    },
  });

  return {
    points: data?.points || 0,
    tier: data?.tier,
    transactions: data?.transactions || [],
    isLoading,
    error,
    applyLoyaltyBonus: applyLoyaltyBonusMutation.mutate,
    applyFreeService: applyFreeServiceMutation.mutate
  };
}

export function useReferral() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['loyalty', 'referral'],
    queryFn: loyaltyApi.getReferralCode,
  });

  // Apply referral Bonus
  const applyReferralBonusMutation = useMutation({
    mutationFn: loyaltyApi.applyReferralBonus,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loyalty'] });
      // toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Bonus de parrainage pas accorder');
    },
  });

  return {
    referralCode: data?.code,
    referrals: data?.referrals || 0,
    // referralList: data?.referralList || [],
    isLoading,
    error,
    applyReferralBonus: applyReferralBonusMutation.mutate,
    isApplying: applyReferralBonusMutation.isPending,
  };
}
