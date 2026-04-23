import axiosdb from '../axios';
export interface RevenueReport {
  totalRevenue: number;
  salesCount: number;
  monthlyBreakdown: Record<string, number>;
  period: {
    from: string;
    to: string;
  };
}

export interface ClientAnalytics {
  totalClients: number;
  newClients: number;
  retentionRate: number;
  topClients: any[];
}

export interface ServicePerformance {
  services: any[];
  mostPopular: any;
}

export const reportsApi = {
  // Revenue report
  getRevenueReport: async (params?: {
    from?: string;
    to?: string;
  }): Promise<RevenueReport> => {
    const { data } = await axiosdb.get('/reports/revenue', { params });
    return data;
  },

  // Client analytics
  getClientAnalytics: async (period?: string): Promise<ClientAnalytics> => {
    const { data } = await axiosdb.get('/reports/clients', {
      params: { period },
    });
    return data;
  },

  // Service performance
  getServicePerformance: async (period?: string): Promise<ServicePerformance> => {
    const { data } = await axiosdb.get('/reports/services', {
      params: { period },
    });
    return data;
  },

  // Staff performance
  getStaffPerformance: async (params: { from: string; to: string }) => {
    const { data } = await axiosdb.get('/reports/staff', { params });
    return data;
  },

  // Peak hours
  getPeakHours: async (params: { from: string; to: string }) => {
    const { data } = await axiosdb.get('/reports/peak-hours', { params });
    return data;
  },

  // Membership analytics
  getMembershipAnalytics: async (params?: { from?: string; to?: string }) => {
    const { data } = await axiosdb.get('/reports/membership', { params });
    return data;
  },

  // Marketing campaigns
  getMarketingCampaigns: async (params?: { from?: string; to?: string }) => {
    const { data } = await axiosdb.get('/reports/marketing', { params });
    return data;
  },

  // Custom report
  createCustomReport: async (reportData: {
    metrics: string[];
    filters: any;
    groupBy: string;
    period: string;
  }): Promise<any> => {
    const { data } = await axiosdb.post('/reports/custom', reportData);
    return data;
  },
};