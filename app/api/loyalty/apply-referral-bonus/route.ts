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

    // 2. Validation
    const { refIds } = await req.json();

    if (!Array.isArray(refIds) || refIds.length === 0 || refIds.length > 5) {
      return errorResponse("Nombre de parrainages invalide (max 5)");
    }

    // 3. Atomic Transaction
    // This ensures data consistency: if one update fails, they all roll back.
    await prisma.$transaction(async (tx) => {
      // Update all selected referrals to 'rewarded'
      await tx.referral.updateMany({
        where: {
          id: { in: refIds },
          referrerId: user.clientProfile!.id, // Security: ensure these belong to the user
          status: { not: "rewarded" }       // Prevent double-claiming
        },
        data: { status: "rewarded" },
      });

      // Increment the user's bonus percentage
      await tx.clientProfile.update({
        where: { id: user.clientProfile!.id },
        data: {
          refBonus: {
            increment: 10,
          },
        },
      });
    });

    return successResponse({
      message: "Félicitations ! Votre bonus de parrainage de 10% a été appliqué.",
    });

  } catch (error) {
    return handleApiError(error);
  }
}
