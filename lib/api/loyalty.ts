import axiosdb from '../axios';

export interface LoyaltyTransaction {
  id: string;
  clientId: string;
  points: number;
  type: 'earned_appointment' | 'earned_referral' | 'redeemed_service' | 'bonus' | 'adjustment';
  description: string;
  relatedId?: string;
  createdAt: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  status: 'pending' | 'completed' | 'rewarded';
  rewardGranted: boolean;
  createdAt: string;
  updatedAt: string;
}

export const loyaltyApi = {
  // Get client loyalty points
  getLoyaltyPoints: async (): Promise<{
    points: number;
    tier: string;
    transactions: LoyaltyTransaction[];
  }> => {
    const { data } = await axiosdb.get('/loyalty/points');
    return data;
  },
  getAllLoyaltyPoints: async (): Promise<{
    transactions: LoyaltyTransaction[];
  }> => {
    const { data } = await axiosdb.get('/loyalty');
    return data;
  },

  // Get referral code
  getReferralCode: async (): Promise<{
    code: string;
    referrals: number;
    // referralList: Referral[];
  }> => {
    const { data } = await axiosdb.get('/loyalty/referral-code');
    return data;
  },

  // Apply referral code
  applyReferralBonus: async (refIds: string[]): Promise<{ message: string }> => {
    const { data } = await axiosdb.put('/loyalty/apply-referral-bonus', { refIds });
    return data;
  },
  // Apply applyLoyaltyBonus code
  applyLoyaltyBonus: async (id: string): Promise<{ message: string }> => {
    const { data } = await axiosdb.put('/loyalty/apply-loyalty-bonus', { id });
    return data;
  },
  // Apply applyLoyaltyBonus code
  applyFreeService: async (id: string): Promise<{ message: string }> => {
    const { data } = await axiosdb.put('/loyalty/apply-free-service-bonus', { id });
    return data;
  },
};
