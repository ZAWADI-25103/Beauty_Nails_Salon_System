"use server"
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError, requireRole, errorResponse } from '@/lib/api/helpers';

export async function GET(_request: NextRequest) {
  try {
    const profile = await prisma.salonProfile.findFirst();

    if (!profile) {
      return errorResponse('Profil non trouvé', 404);
    }

    return successResponse(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole(['admin']);

    const body = await request.json();
    const profile = await prisma.salonProfile.updateMany({
      data: body,
    });

    return successResponse({
      message: 'Profil mis à jour',
      profile,
    });
  } catch (error) {
    return handleApiError(error);
  }
}