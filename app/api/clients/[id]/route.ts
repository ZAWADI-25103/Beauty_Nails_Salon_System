"use server"
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, errorResponse, successResponse, handleApiError, requireRole } from '@/lib/api/helpers';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string; }>; }
) {
  try {
    
    requireRole(['admin', 'client', 'worker'])

    const id = (await context.params).id;

    const client = await prisma.clientProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            createdAt: true,
          },
        },
        appointments: {
          include: {
            service: true,
            worker: {
              include: {
                user: {
                  select: {
                    name: true,
                    avatar: true,
                  },
                },
              },
            },
          },
          orderBy: { date: 'desc' },
          take: 10,
        },
        loyaltyTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        membershipPurchases: {
          where: { status: 'active' },
          include: {
            membership: true,
          },
        },
      },
      cacheStrategy: { 
        ttl: 60,      // Fresh for 60 seconds
        swr: 30,      // For another 30s, serve old data while updating in background
      },
    });

    if (!client) {
      return errorResponse('Client non trouvé', 404);
    }

    return successResponse(client);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; }>; }
) {
  try {
    
    requireRole(['admin', 'client', 'worker'])

    const id = (await context.params).id;
    const body = await request.json();

    const {
      name,
      email,
      phone,
      tier,
      notes,
      birthday,
      address,
      allergies,
      favoriteServices,
      prepaymentBalance,
      giftCardBalance,
      referrals,
    } = body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        role: 'client',
        clientProfile: {
          update: {
            tier: tier || 'Regular',
            notes,
            birthday: birthday ? new Date(birthday) : undefined,
            address: address || undefined,
            allergies: Array.isArray(allergies) ? allergies.join(", ") : '',
            favoriteServices: Array.isArray(favoriteServices) ? favoriteServices : (favoriteServices ? String(favoriteServices).split(',').map(s=>s.trim()).filter(Boolean) : []),
            prepaymentBalance: prepaymentBalance ? Number(prepaymentBalance) : undefined,
            giftCardBalance: giftCardBalance ? Number(giftCardBalance) : undefined,
            referrals: referrals ? Number(referrals) : undefined,
          },
        },
      },
      include: { clientProfile: true },
    });

    return successResponse({ message: 'Client(e) modifié avec success', client: user.clientProfile }, 201);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return errorResponse('Email ou téléphone déjà utilisé', 400);
    }
    return handleApiError(error);
  }
}