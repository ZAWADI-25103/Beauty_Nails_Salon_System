import { UserRole } from '@/prisma/generated/enums';
import axiosdb from '../axios';

export interface SalonProfile {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  description?: string;
  logo?: string;
  openingHours?: any;
  socialMedia?: any;
  currency: string;
  timezone: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemSettings {
  [key: string]: any;
}

export const settingsApi = {
  // Get salon profile
  getSalonProfile: async (): Promise<SalonProfile> => {
    const { data } = await axiosdb.get('/settings/profile');
    return data;
  },

  // Update salon profile
  updateSalonProfile: async (profile: Partial<SalonProfile>): Promise<SalonProfile> => {
    const { data } = await axiosdb.put('/settings/profile', profile);
    return data;
  },

  // Get system settings
  getSystemSettings: async (): Promise<SystemSettings> => {
    const { data } = await axiosdb.get('/settings/system');
    return data;
  },
  getUsers: async (): Promise<{
    name: string;
    id: string;
    email: string;
    emailVerified: Date | null;
    password: string;
    phone: string;
    avatar: string | null;
    role: UserRole;
    isActive: boolean;
    resetToken: string | null;
    resetTokenExpires: Date | null;
    otpSecret: string | null;
    otpSecretExpires: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }[]> => {
    const { data } = await axiosdb.get('/settings/users');
    return data;
  },

  // Update system settings
  updateSystemSettings: async (settings: SystemSettings): Promise<SystemSettings> => {
    const { data } = await axiosdb.post('/settings/system', settings);
    return data;
  },
};