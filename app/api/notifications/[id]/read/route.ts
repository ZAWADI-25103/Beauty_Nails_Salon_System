"use server"
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, successResponse, handleApiError } from '@/lib/api/helpers';

export async function PUT(
  _request: NextRequest,
  context: { params: Promise<{ id: string; }>; }
) {
  try {
    const id = (await context.params).id;
    const user = await getAuthenticatedUser();

    await prisma.notification.update({
      where: {
        id,
        userId: user.id,
      },
      data: { isRead: true },
    });

    return successResponse({ message: 'Notification marquée comme lue' });
  } catch (error) {
    return handleApiError(error);
  }
}