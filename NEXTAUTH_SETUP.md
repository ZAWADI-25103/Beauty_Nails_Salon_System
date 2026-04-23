# Beauty Nails - NextAuth Setup Guide

This document provides a comprehensive guide for implementing NextAuth.js authentication in the Beauty Nails Next.js application.

## Overview

Beauty Nails uses NextAuth.js v5 (Auth.js) for authentication with three user roles:
- **Client**: Book appointments, manage profile, view loyalty points
- **Worker**: View schedule, manage appointments, update availability
- **Admin**: Full access to all salon management features

---

## Installation

```bash
npm install next-auth@beta @auth/prisma-adapter bcryptjs
npm install -D @types/bcryptjs
```

---

## File Structure

```
/app
  /api
    /auth
      /[...nextauth]
        route.ts          # NextAuth API route
  /lib
    /auth
      auth.config.ts      # NextAuth configuration
      auth.ts             # Auth instance and helpers
      session.ts          # Client-side session hooks
/prisma
  schema.prisma           # Prisma schema with User, Account, Session models
```

---

## 1. NextAuth Configuration (`/lib/auth/auth.config.ts`)

```typescript
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import prisma from '@/lib/prisma';

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email et mot de passe requis');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            clientProfile: true,
            workerProfile: true,
          },
        });

        if (!user) {
          throw new Error('Email ou mot de passe incorrect');
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Email ou mot de passe incorrect');
        }

        if (!user.emailVerified) {
          throw new Error('Veuillez vérifier votre email');
        }

        // Return user object with role-specific data
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          isActive: user.isActive,
          // Add role-specific profile data
          clientProfile: user.clientProfile,
          workerProfile: user.workerProfile,
        };
      },
    }),
  ],
  
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
        token.avatar = user.avatar;
        token.isActive = user.isActive;
        token.clientProfile = user.clientProfile;
        token.workerProfile = user.workerProfile;
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'client' | 'worker' | 'admin';
        session.user.phone = token.phone as string;
        session.user.avatar = token.avatar as string | null;
        session.user.isActive = token.isActive as boolean;
        session.user.clientProfile = token.clientProfile as any;
        session.user.workerProfile = token.workerProfile as any;
      }
      return session;
    },

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;

      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnAuth = nextUrl.pathname.startsWith('/auth');

      // Redirect to login if accessing dashboard without auth
      if (isOnDashboard && !isLoggedIn) {
        return Response.redirect(new URL('/auth/login', nextUrl));
      }

      // Redirect to appropriate dashboard if logged in and on auth pages
      if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL(`/dashboard/${role}`, nextUrl));
      }

      // Check role-based access
      if (isOnDashboard && isLoggedIn) {
        const dashboardRole = nextUrl.pathname.split('/')[2]; // /dashboard/admin -> 'admin'
        
        if (dashboardRole !== role && role !== 'admin') {
          // Admins can access any dashboard, others only their own
          return Response.redirect(new URL(`/dashboard/${role}`, nextUrl));
        }
      }

      return true;
    },
  },

  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};
```

---

## 2. Auth Instance (`/lib/auth/auth.ts`)

```typescript
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  ...authConfig,
});

// Helper functions for server components
export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session.user;
}

export async function requireRole(allowedRoles: ('client' | 'worker' | 'admin')[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden');
  }
  return user;
}
```

---

## 3. Client-Side Session Hook (`/lib/auth/session.ts`)

```typescript
'use client';

import { useSession as useNextAuthSession } from 'next-auth/react';

export interface ClientProfile {
  id: string;
  tier: 'Regular' | 'VIP' | 'Premium';
  loyaltyPoints: number;
  totalAppointments: number;
  totalSpent: number;
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
  name: string;
  email: string;
  phone: string;
  role: 'client' | 'worker' | 'admin';
  avatar: string | null;
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
```

---

## 4. NextAuth API Route (`/app/api/auth/[...nextauth]/route.ts`)

```typescript
import { handlers } from '@/lib/auth/auth';

export const { GET, POST } = handlers;
```

---

## 5. TypeScript Types (`/types/next-auth.d.ts`)

```typescript
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    role: 'client' | 'worker' | 'admin';
    phone: string;
    avatar: string | null;
    isActive: boolean;
    clientProfile?: {
      id: string;
      tier: 'Regular' | 'VIP' | 'Premium';
      loyaltyPoints: number;
      totalAppointments: number;
      totalSpent: number;
      referralCode: string;
      referredBy?: string;
      preferences?: any;
      notes?: string;
    } | null;
    workerProfile?: {
      id: string;
      position: string;
      specialties: string[];
      commissionRate: number;
      rating: number;
      isAvailable: boolean;
      workingHours?: any;
    } | null;
  }

  interface Session {
    user: User & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'client' | 'worker' | 'admin';
    phone: string;
    avatar: string | null;
    isActive: boolean;
    clientProfile?: any;
    workerProfile?: any;
  }
}
```

---

## 6. Environment Variables

Add to your `.env` file:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-nextauth-key-min-32-chars

# Database (from your existing setup)
DATABASE_URL=postgresql://user:password@localhost:5432/beauty_nails
```

Generate secret:
```bash
openssl rand -base64 32
```

---

## 7. Usage Examples

### Server Components (App Router)

```typescript
// app/dashboard/client/page.tsx
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';

export default async function ClientDashboard() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/login');
  }

  if (session.user.role !== 'client') {
    redirect(`/dashboard/${session.user.role}`);
  }

  return (
    <div>
      <h1>Bienvenue, {session.user.name}</h1>
      <p>Points de fidélité: {session.user.clientProfile?.loyaltyPoints}</p>
    </div>
  );
}
```

### Client Components

```typescript
'use client';

import { useAuth } from '@/lib/auth/session';
import { signOut } from 'next-auth/react';

export function UserMenu() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  return (
    <div>
      <p>{user.name}</p>
      <p>{user.role}</p>
      <button onClick={() => signOut()}>Se déconnecter</button>
    </div>
  );
}
```

### API Routes with Protection

```typescript
// app/api/appointments/route.ts
import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Client can only see their own appointments
  const where = session.user.role === 'client' 
    ? { clientId: session.user.id }
    : {};

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      service: true,
      client: true,
      worker: true,
    },
  });

  return NextResponse.json(appointments);
}
```

---

## 8. Login/Signup Forms

### Login Form

```typescript
'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Connexion réussie !');
        router.push('/dashboard'); // Will redirect based on role
        router.refresh();
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <input type="email" name="email" required />
      <input type="password" name="password" required />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Connexion...' : 'Se connecter'}
      </button>
    </form>
  );
}
```

### Signup Form

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import axiosdb from '@/lib/axios';

export function SignupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      password: formData.get('password') as string,
      role: 'client', // Default role for public signup
    };

    try {
      // Register user
      await axiosdb.post('/api/auth/register', data);

      // Auto-login after registration
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Compte créé avec succès !');
        router.push('/dashboard/client');
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <input type="text" name="name" required />
      <input type="email" name="email" required />
      <input type="tel" name="phone" required />
      <input type="password" name="password" required />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Création...' : 'Créer un compte'}
      </button>
    </form>
  );
}
```

---

## 9. Middleware for Route Protection

Create `/middleware.ts` in your root directory:

```typescript
export { auth as middleware } from '@/lib/auth/auth';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/appointments/:path*',
    '/api/clients/:path*',
    '/api/staff/:path*',
    '/api/inventory/:path*',
    '/api/payments/:path*',
    '/api/reports/:path*',
    '/api/loyalty/:path*',
    '/api/marketing/:path*',
    '/api/notifications/:path*',
  ],
};
```

---

## 10. Session Provider Setup

Wrap your app with SessionProvider:

```typescript
// app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

```typescript
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## 11. Axios Integration with NextAuth

Update your axios instance to use NextAuth session:

```typescript
// lib/axiosdb.ts
import axios from 'axios';
import { getSession } from 'next-auth/react';

const baseurl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const axiosdb = axiosdb.create({
  baseURL: baseurl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor to add auth token
axiosdb.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    if (session?.user) {
      // For Next.js API routes, session is handled by NextAuth
      // No need to add Authorization header
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosdb.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Redirect to login or refresh session
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default axiosdb;
```

---

## 12. Migration Path from Vite

1. **Keep current Vite app running**
2. **Set up Next.js app in parallel**
3. **Copy components to Next.js** (update imports for App Router)
4. **Implement NextAuth** following this guide
5. **Update API calls** to use Next.js API routes
6. **Test authentication flow**
7. **Migrate pages gradually**
8. **Switch to Next.js in production**

---

## Summary

This NextAuth setup provides:
- ✅ Secure credential-based authentication
- ✅ JWT session strategy for scalability
- ✅ Role-based access control (client, worker, admin)
- ✅ Server and client-side authentication
- ✅ TypeScript support with proper types
- ✅ Integration with Prisma ORM
- ✅ Middleware for route protection
- ✅ Session management and updates
- ✅ French language support

All authentication is handled server-side for maximum security, with client-side hooks for UI updates.
