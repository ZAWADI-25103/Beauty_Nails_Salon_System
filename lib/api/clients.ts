import { ReferralStatus, Tier } from '@/prisma/generated/enums';
import axiosdb from '../axios';

export interface Client {
  id: string;
  userId: string;
  tier: 'Regular' | 'VIP' | 'Premium';
  loyaltyPoints: number;
  totalAppointments: number;
  // totalSpent may be a number from the server; UI may display as string
  totalSpent: number | string;
  referralCode: string;
  referredBy?: string;
  preferences?: any;
  notes?: string;
  // new profile fields
  birthday?: string;
  address?: string;
  favoriteServices?: string[];
  allergies: string[];
  prepaymentBalance?: number | string;
  giftCardBalance?: number | string;
  freeServiceCount: number,
  giftCardCount: number,
  refBonus: number,
  referrals?: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string | null;
    isActive: boolean;
    createdAt: string;
  };
  referralsReceived: {
    id: string,
    referrerId: string,
    referredId: string,
    status: "pending" | "completed" | "rewarded",
    rewardGranted: boolean,
  }[]
  appointments?: any[];
  loyaltyTransactions?: any[];
  membershipPurchases?: any[];
}


export interface ReferralData{
  referrer: {
    id: string;
    tier: Tier;
    loyaltyPoints: number;
    totalAppointments: number;
    totalSpent: number;
    referrals: number;
    user: {
        name: string;
        email: string;
        phone: string;
    };
  }
  referred: {
    id: string;
    tier: Tier;
    loyaltyPoints: number;
    totalAppointments: number;
    totalSpent: number;
    referrals: number;
    user: {
        name: string;
        email: string;
        phone: string;
    };
  }
  id: string;
  createdAt: Date;
  referrerId: string;
  referredId: string;
  status: ReferralStatus;
  rewardGranted: boolean;
}[]

export interface ClientsParams {
  search?: string;
  status?: string;
  tier?: string;
  page?: number;
  limit?: number;
}

export const clientsApi = {
  // Get all clients
  getClients: async (params?: ClientsParams): Promise<{
    clients: Client[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const { data } = await axiosdb.get('/clients', { params });
    return data;
  },

  // Get client profile
  getClient: async (id: string): Promise<Client> => {
    const { data } = await axiosdb.get(`/clients/${id}`);
    return data;
  },

  // Update client notes
  updateClientNotes: async (id: string, notes: string): Promise<{ client: Client; message: string }> => {
    const { data } = await axiosdb.patch(`/clients/${id}/notes`, { notes });
    return data;
  },

  // Create client (admin)
  createClient: async (payload: { name: string; email: string; phone: string; tier?: string; notes?: string; password?: string; birthday?: string; address?: string; allergies: string[]; favoriteServices?: string[]; prepaymentBalance?: number | string; giftCardBalance?: number | string; referrals?: number; }) => {
    const { data } = await axiosdb.post('/clients', payload);
    return data;
  },

  updateClient: async (payload: { userId: string, name: string; email: string; phone: string; tier?: string; notes?: string; password?: string; birthday?: string; address?: string; allergies: string[]; favoriteServices?: string[]; prepaymentBalance?: number | string; giftCardBalance?: number | string; referrals?: number; }) => {
    const { data } = await axiosdb.patch(`/clients/${payload.userId}`, payload);
    return data;
  },

  // Get client appointments
  getClientAppointments: async (id: string, params?: {
    status?: string;
    from?: string;
    to?: string;
  }): Promise<any[]> => {
    const { data } = await axiosdb.get(`/clients/${id}/appointments`, { params });
    return data;
  },


  // Get client referrals
  getClientReferrals: async (id: string | undefined): Promise<ReferralData[]> => {
    const { data } = await axiosdb.get(`/clients/${id}/referrals`);
    return data;
  }
};
