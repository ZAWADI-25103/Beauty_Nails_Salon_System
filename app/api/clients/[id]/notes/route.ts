"use server"
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, successResponse, handleApiError } from '@/lib/api/helpers';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; }>; }
) {
  try {
    const id = (await context.params).id;

    await requireRole(['admin', 'worker']);

    const body = await request.json();
    const { notes } = body;

    const client = await prisma.clientProfile.update({
      where: { userId: id },
      data: { notes },
    });

    return successResponse({
      message: 'Notes mises à jour',
      client,
    });
  } catch (error) {
    return handleApiError(error);
  }
}