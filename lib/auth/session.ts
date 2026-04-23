'use client';

import { useSession as useNextAuthSession } from 'next-auth/react';

export interface ClientProfile {
  id: string;
  tier: 'Regular' | 'VIP' | 'Premium';
  loyaltyPoints: number;
  totalAppointments: number;
  totalSpent: number | string;
  referralCode: string;
  referredBy?: string;
  preferences?: any;
  notes?: string;
}

export interface WorkerProfile {
  id: string;
  position: string;
  specialties: string[];
  commissionRate: number;
  rating: number;
  isAvailable: boolean;
  workingHours?: any;
}

export interface User {
  id: string;
  name?: string | null | undefined ;
  email?: string | null | undefined;
  phone?: string | null | undefined;
  emailVerified?: Date | null | undefined;
  role: 'client' | 'worker' | 'admin';
  avatar?: string | null | undefined ;
  isActive: boolean;
  clientProfile?: ClientProfile | null;
  workerProfile?: WorkerProfile | null;
}

export interface Session {
  user: User;
  expires: string;
}

export function useAuth() {
  const { data: session, status, update } = useNextAuthSession();

  return {
    user: session?.user as User | undefined,
    session: session as Session | null,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    updateSession: update,
  };
}

// Role-based hooks
export function useRequireAuth() {
  const { user, isLoading } = useAuth();

  if (!isLoading && !user) {
    throw new Error('Authentication required');
  }

  return { user, isLoading };
}

export function useRequireRole(allowedRoles: ('client' | 'worker' | 'admin')[]) {
  const { user, isLoading } = useAuth();

  if (!isLoading && (!user || !allowedRoles.includes(user.role))) {
    throw new Error('Insufficient permissions');
  }

  return { user, isLoading };
}

// Convenience hooks for specific roles
export function useClientAuth() {
  return useRequireRole(['client']);
}

export function useWorkerAuth() {
  return useRequireRole(['worker']);
}

export function useAdminAuth() {
  return useRequireRole(['admin']);
}