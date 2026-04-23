"use server"
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, successResponse, handleApiError, errorResponse } from '@/lib/api/helpers';

export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    const client = await prisma.clientProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        referralCode: true,
        referrals: true,
      }
    });

    if (!client) {
      return errorResponse('Client non trouvé', 404);
    }

    console.log("Returned data:", {
      code: client.referralCode,
      referrals: client.referrals || 0,
    });

    return successResponse({
      code: client.referralCode,
      referrals: client.referrals || 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}