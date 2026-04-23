'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { signOut, useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/auth/session';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>; // Add refreshSession to the context
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const [user, setUser] = useState(session?.user || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!session?.user);
  const router = useRouter();

  useEffect(() => {
    setUser(session?.user || null);
    setIsAuthenticated(!!session?.user);
  }, [session]);

  const logout = async () => {
    await signOut({ redirect: false });
    setUser(null);
    setIsAuthenticated(false);
    router.push('/auth/login');
  };

  const refreshSession = async () => {
    const updatedSession = await getSession(); // Fetch the updated session
    setUser(updatedSession?.user || null);
    setIsAuthenticated(!!updatedSession?.user);

    // Force NextAuth to refresh the session
    const event = new Event("visibilitychange");
    document.dispatchEvent(event);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};