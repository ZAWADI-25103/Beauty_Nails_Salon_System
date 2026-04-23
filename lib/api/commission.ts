import axiosdb from "../axios";

export interface Commission {
  status: 'paid' | 'pending';
  id: string;
  workerId: string;
  period: string;
  appointmentsCount: number;
  totalRevenue: number;
  commissionRate: number;
  commissionAmount: number;
  businessEarnings: number,
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const commissionApi = {
  create: async (data: {
    workerId: string;
    period?: string;
    totalRevenue: number;
    appointmentsCount: number;
    commissionRate: number;
  }): Promise<Commission> => {
    const { data: res } = await axiosdb.post("/commissions", data);
    return res;
  },

  update: async (id: string, status: string): Promise<Commission> => {
    const { data } = await axiosdb.patch(`/commissions/${id}`, { status });
    return data;
  },

  getAll: async (): Promise<Commission[]> => {
    const { data } = await axiosdb.get("/commissions");
    return data;
  }
};


