import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, successResponse, handleApiError } from '@/lib/api/helpers';

export async function GET(
  _request: NextRequest,
    context: { params: Promise<{ id: string; }>; }
  ) {
    try {
      const id = (await context.params).id;
    // await requireRole(['admin', 'worker', 'client']);
    
    const addOns = await prisma.serviceAddOn.findMany({
      where: { serviceId: id },
      orderBy: { createdAt: 'asc' }
    });
    
    return successResponse(addOns);
  } catch (error) {
    return handleApiError(error);
  }
}
