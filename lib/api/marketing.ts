import axiosdb from '../axios';

export interface MarketingCampaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'both';
  target: string;
  message: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  scheduledDate?: string;
  sentDate?: string;
  recipients: number;
  openRate: number;
  clickRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  minPurchase: number;
  maxUses: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const marketingApi = {
  // Campaigns
  getCampaigns: async (): Promise<MarketingCampaign[]> => {
    const { data } = await axiosdb.get('/marketing/campaigns');
    return data;
  },

  getCampaign: async (id: string): Promise<MarketingCampaign> => {
    const { data } = await axiosdb.get(`/marketing/campaigns/${id}`);
    return data;
  },

  createCampaign: async (campaignData: Partial<MarketingCampaign>): Promise<MarketingCampaign> => {
    const { data } = await axiosdb.post('/marketing/campaigns', campaignData);
    return data;
  },

  updateCampaign: async (id: string, campaignData: Partial<MarketingCampaign>): Promise<MarketingCampaign> => {
    const { data } = await axiosdb.patch(`/marketing/campaigns/${id}`, campaignData);
    return data;
  },

  deleteCampaign: async (id: string): Promise<void> => {
    await axiosdb.delete(`/marketing/campaigns/${id}`);
  },

  sendCampaign: async (id: string): Promise<{ message: string }> => {
    const { data } = await axiosdb.post(`/marketing/campaigns/${id}/send`);
    return data;
  },

  // Discount Codes
  getDiscounts: async (): Promise<DiscountCode[]> => {
    const { data } = await axiosdb.get('/marketing/discounts');
    return data;
  },

  getDiscount: async (id: string): Promise<DiscountCode> => {
    const { data } = await axiosdb.get(`/marketing/discounts/${id}`);
    return data;
  },

  createDiscount: async (discountData: Partial<DiscountCode>): Promise<DiscountCode> => {
    const { data } = await axiosdb.post('/marketing/discounts', discountData);
    return data;
  },

  updateDiscount: async (id: string, discountData: Partial<DiscountCode>): Promise<DiscountCode> => {
    const { data } = await axiosdb.patch(`/marketing/discounts/${id}`, discountData);
    return data;
  },

  deleteDiscount: async (id: string): Promise<void> => {
    await axiosdb.delete(`/marketing/discounts/${id}`);
  },

  validateDiscount: async (code: string): Promise<DiscountCode> => {
    const { data } = await axiosdb.get(`/marketing/discounts/validate/${code}`);
    return data;
  },
};
