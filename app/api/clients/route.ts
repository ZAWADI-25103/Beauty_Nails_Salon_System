"use server"
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, successResponse, errorResponse, handleApiError } from '@/lib/api/helpers';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'worker', 'client']);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    // const status = searchParams.get('status');
    const tier = searchParams.get('tier');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (tier) {
      where.tier = tier;
    }

    const [clients, total] = await Promise.all([
      prisma.clientProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              isActive: true,
              createdAt: true,
            },
          },
          referralsReceived: {
            select: {
              id: true,
              referrerId: true,
              referredId: true,
              status: true,
              rewardGranted: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        cacheStrategy: { 
          ttl: 60,      // Fresh for 60 seconds
          swr: 30,      // For another 30s, serve old data while updating in background
        },
      }),
      prisma.clientProfile.count({ where }),
    ]);

    return successResponse({
      clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin']);

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
      password,
    } = body;

    if (!name || !email || !phone) {
      throw new Error('Name, email and phone are required');
    }

    // const pwd = await hash(password, 10);
    const referralCode = nanoid(8).toUpperCase();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password,
        role: 'client',
        emailVerified: new Date(),
        clientProfile: {
          create: {
            tier: tier || 'Regular',
            referralCode,
            notes,
            birthday: birthday ? new Date(birthday) : undefined,
            address: address || undefined,
            allergies: Array.isArray(allergies) ? allergies.join(", ") : '' ,
            favoriteServices: Array.isArray(favoriteServices) ? favoriteServices : (favoriteServices ? String(favoriteServices).split(',').map(s=>s.trim()).filter(Boolean) : []),
            prepaymentBalance: prepaymentBalance ? Number(prepaymentBalance) : undefined,
            giftCardBalance: giftCardBalance ? Number(giftCardBalance) : undefined,
            referrals: referrals ? Number(referrals) : undefined,
          },
        },
      },
      include: { clientProfile: true },
    });

    return successResponse({ message: 'Client(e) créé avec success', client: user.clientProfile }, 201);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return errorResponse('Email ou téléphone déjà utilisé', 400);
    }
    return handleApiError(error);
  }
}