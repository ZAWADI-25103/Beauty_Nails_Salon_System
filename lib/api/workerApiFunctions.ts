import axiosdb from '../axios';
import { Worker } from './staff'

export interface WorkerProfileUpdateData {
  position?: string;
  specialties?: string[];
  commissionRate?: number;
  commissionType?: string;
  commissionFrequency?: string;
  commissionDay?: number;
  minimumPayout?: number;
  bio?: string;
  workingHours?: any;
  isAvailable?: boolean;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export const workerApiFunctions = {
  getWorkerProfile: async (id: string): Promise<Worker> => {
    const response = await axiosdb.get(`/workers/${id}/profile`);
    return response.data;
  },
  getWorkerProfiles: async (): Promise<Worker[]> => {
    const response = await axiosdb.get(`/workers`);
    return response.data;
  },

  updateWorkerProfile: async (id: string, data: WorkerProfileUpdateData) => {
    const response = await axiosdb.put(`/workers/${id}/profile`, data);
    return response.data;
  },

  getCommissionReport: async (id: string, period?: string) => {
    const response = await axiosdb.get(`/workers/${id}/commission/report`, {
      params: { period }
    });
    return response.data;
  },

  getPaymentHistory: async (id: string) => {
    const response = await axiosdb.get(`/workers/${id}/payments`);
    return response.data;
  },

  getEarningsStatement: async (id: string, period?: string) => {
    const response = await axiosdb.get(`/workers/${id}/earnings/statement`, {
      params: { period }
    });
    return response.data;
  }
};