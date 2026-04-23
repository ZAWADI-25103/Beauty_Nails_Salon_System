import axiosdb from '../axios';
import { Service } from './services';

export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  discount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  services?: Service[];
}

export interface CreatePackageData {
  name: string;
  description: string;
  price: number;
  discount?: number;
  isActive?: boolean;
  serviceIds: string[]; // IDs of services to include in the package
}

export const packagesApi = {
  // Get all packages
  getPackages: async (params?: { active?: boolean }): Promise<ServicePackage[]> => {
    const { data } = await axiosdb.get('/packages', { params });
    return data;
  },

  // Get single package
  getPackage: async (id: string): Promise<ServicePackage> => {
    const { data } = await axiosdb.get(`/packages/${id}`);
    return data;
  },

  // Create package
  createPackage: async (packageData: CreatePackageData): Promise<ServicePackage> => {
    const { data } = await axiosdb.post('/packages', packageData);
    return data;
  },

  // Update package
  updatePackage: async (id: string, updates: Partial<CreatePackageData>): Promise<ServicePackage> => {
    const { data } = await axiosdb.patch(`/packages/${id}`, updates);
    return data;
  },

  // Delete package
  deletePackage: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await axiosdb.delete(`/packages/${id}`);
    return data;
  },
};
