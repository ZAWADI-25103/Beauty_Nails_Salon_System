import NextAuth from 'next-auth';
// import prisma from '@/lib/prisma';
import { authConfig } from './auth.config';
import { Decimal } from '@/prisma/generated/internal/prismaNamespaceBrowser';
// import { PrismaAdapter } from '@auth/prisma-adapter';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
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

export function clean(obj: any, seen = new WeakSet()): any {
  if (!obj || typeof obj !== "object") return obj;

  if (seen.has(obj)) return undefined;
  seen.add(obj);

  if (obj instanceof Decimal) return obj.toNumber();

  if (Array.isArray(obj)) return obj.map(v => clean(v, seen));

  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, clean(v, seen)])
  );
}
