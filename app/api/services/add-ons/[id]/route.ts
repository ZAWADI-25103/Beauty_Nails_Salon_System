import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, successResponse, handleApiError, errorResponse } from '@/lib/api/helpers';

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; }>; }
  ) {
  try {
    const id = (await context.params).id;
    await requireRole(['admin']);
    
    if (!id) {
      return errorResponse('id is required', 400);
    }
    
    const serviceAddOn = await prisma.serviceAddOn.delete({
      where: { id }
    });

    await prisma.service.update({
      where: { id: serviceAddOn.serviceId },
      data: {
        price: {
          decrement: serviceAddOn.price
        },
        duration: {
          decrement: serviceAddOn.duration
        }
      }
    });
    
    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}