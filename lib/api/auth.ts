import axiosdb from '../axios';
import { Worker } from './staff'

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'client' | 'worker' | 'admin';
  avatar: string | null;
  isActive: boolean;
  clientProfile?: ClientProfile | null;
  workerProfile?: Worker | null;
}

export interface ClientProfile {
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
  allergies?: string;
  prepaymentBalance?: number | string;
  giftCardBalance?: number | string;
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

export interface WorkerProfile {
  id: string;
  userId: string;
  position: string;
  specialties: string[];
  commissionRate: number;
  rating: number;
  totalReviews: number;
  isAvailable: boolean;
  workingHours?: any;
  hireDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: 'client' | 'worker' | 'admin';
}

export const authApi = {
  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const { data } = await axiosdb.get('/auth/me');
    return data;
  },

  // Login user
  login: async (credentials: LoginData): Promise<{ user: User }> => {
    const { data } = await axiosdb.post('/auth/login', credentials);
    return data;
  },

  // Register user
  register: async (userData: RegisterData): Promise<{ user: User; message: string }> => {
    const { data } = await axiosdb.post('/auth/register', userData);
    return data;
  },

  // Update profile
  updateProfile: async (updates: Partial<User>): Promise<{ user: User; message: string }> => {
    const { data } = await axiosdb.patch('/auth/profile', updates);
    return data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await axiosdb.post('/auth/logout');
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await axiosdb.post('/api/mail/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await axiosdb.post('/api/auth/reset-password', { token, newPassword });
    return response.data;
  },

  // Send OTP
  sendOtp: async (email: string): Promise<{ message: string }> => {
    const response = await axiosdb.post('/api/mail/otp', { email });
    return response.data;
  },

  // Verify OTP
  verifyOtp: async (email: string, otp: string): Promise<{ message: string }> => {
    const response = await axiosdb.get(`/api/mail/verify-otp?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`);
    return response.data;
  },

  // Send welcome email
  sendWelcomeEmail: async (email: string): Promise<{ message: string }> => {
    const response = await axiosdb.post('/api/mail/welcome', { email });
    return response.data;
  },
};
