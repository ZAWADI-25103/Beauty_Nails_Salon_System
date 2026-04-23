import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { clean } from './auth';

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: {
          type: "email",
          label: "Email",
          placeholder: "johndoe@gmail.com",
        },
        password: {
          type: "password",
          label: "Password",
          placeholder: "*****",
        },
      },
      authorize: async (credentials) =>{
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            clientProfile: {
              select: {
                id: true,
                tier: true,
                loyaltyPoints: true,
                totalAppointments: true,
                totalSpent: true,
                freeServiceCount: true,
                giftCardCount: true,
                refBonus: true,
                referralCode: true,
                referredBy: true,
                preferences: true,
                notes: true,
              }
            },
            workerProfile: {
              select: {
                id: true,
                position: true,
                specialties: true,
                commissionRate: true,
                rating: true,
                isAvailable: true,
                workingHours: true,
              }
            }
          },
          cacheStrategy: { 
            ttl: 60,      // Fresh for 60 seconds
            swr: 30,      // For another 30s, serve old data while updating in background
          },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // if (!user.emailVerified) {
        //   throw new Error('Veuillez vérifier votre email');
        // }

        // Return user object with role-specific data
        return clean({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          emailVerified: user.emailVerified,
          avatar: user.avatar,
          isActive: user.isActive,
          // Add role-specific profile data
          clientProfile: user.clientProfile,
          workerProfile: user.workerProfile,
        });
      },
    }),
  ],
  
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        const safe = clean(user); // 🧹 sanitize deeply

        token.id = safe.id;
        token.role = safe.role;
        token.phone = safe.phone;
        token.avatar = safe.avatar;
        token.emailVerified = safe.emailVerified;
        token.isActive = safe.isActive;
        token.clientProfile = safe.clientProfile;
        token.workerProfile = safe.workerProfile;
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        const safe = clean(token);

        session.user = {
          id: safe.id,
          email: safe.email,
          name: safe.name,
          role: safe.role,
          emailVerified: safe.emailVerified,
          phone: safe.phone,
          avatar: safe.avatar,
          isActive: safe.isActive,
          clientProfile: safe.clientProfile,
          workerProfile: safe.workerProfile,
        };
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
    newUser: '/auth/register',
    signOut: '/auth/logout',
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};