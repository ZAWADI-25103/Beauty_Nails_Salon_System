import { errorResponse, getAuthenticatedUser, handleApiError, requireRole, successResponse } from '@/lib/api/helpers';
import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function PUT(req: NextRequest) {
  try {
    // 1. Authorization & Context
    await requireRole(['client', 'admin', 'worker']);
    const user = await getAuthenticatedUser();

    if (!user?.clientProfile?.id) {
      return errorResponse("Profil client introuvable", 404);
    }

    await prisma.clientProfile.update({
      where: { id : user.clientProfile.id},
      data:{
        giftCardBalance: { increment: 15000 },
        giftCardCount: { increment: 1 },
        loyaltyPoints: { increment: 500 }
      }
    })

    return successResponse({
      message: "Félicitations ! Vous avez recu une cadeau de valeur 15000.",
    });

  } catch (error) {
    return handleApiError(error);
  }
}
