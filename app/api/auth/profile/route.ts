"use server"
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, successResponse, handleApiError } from '@/lib/api/helpers';

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const body = await request.json();
    const { name, phone, avatar, preferences } = body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(avatar && { avatar }),
        ...(user.role === 'client' && preferences && {
          clientProfile: {
            update: { preferences },
          },
        }),
      },
      include: {
        clientProfile: true,
        workerProfile: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        clientProfile: true,
        workerProfile: true,
      },
    });

    return successResponse({
      user: updatedUser,
      message: 'Profil mis à jour avec succès',
    });
  } catch (error) {
    return handleApiError(error);
  }
}