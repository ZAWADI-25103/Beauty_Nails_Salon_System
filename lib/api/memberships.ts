import axiosdb from '../axios';

export interface Membership {
  id: string;
  name: string;
  duration: number;
  price: number;
  discount: number;
  benefits: any;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipPurchase {
  id: string;
  clientId: string;
  membershipId: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled';
  autoRenew: boolean;
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
  client?: any;
  membership?: Membership;
}

export const membershipsApi = {
  // Memberships
  getMemberships: async (): Promise<Membership[]> => {
    const { data } = await axiosdb.get('/memberships');
    return data;
  },

  getMembership: async (id: string): Promise<Membership> => {
    const { data } = await axiosdb.get(`/memberships/${id}`);
    return data;
  },

  createMembership: async (membershipData: Partial<Membership>): Promise<Membership> => {
    const { data } = await axiosdb.post('/memberships', membershipData);
    return data;
  },

  updateMembership: async (id: string, membershipData: Partial<Membership>): Promise<Membership> => {
    const { data } = await axiosdb.patch(`/memberships/${id}`, membershipData);
    return data;
  },

  deleteMembership: async (id: string): Promise<void> => {
    await axiosdb.delete(`/memberships/${id}`);
  },

  // Purchases
  getPurchases: async (params?: { clientId?: string, membershipId?: string }): Promise<MembershipPurchase[]> => {
    const { data } = await axiosdb.get('/memberships/purchases', { params });
    return data;
  },

  purchaseMembership: async (purchaseData: { 
    clientId: string; 
    membershipId: string; 
    autoRenew?: boolean 
  }): Promise<MembershipPurchase> => {
    const { data } = await axiosdb.post('/memberships/purchases', purchaseData);
    return data;
  },

  updatePurchase: async (id: string, purchaseData: Partial<MembershipPurchase>): Promise<MembershipPurchase> => {
    const { data } = await axiosdb.patch(`/memberships/purchases/${id}`, purchaseData);
    return data;
  },
};
