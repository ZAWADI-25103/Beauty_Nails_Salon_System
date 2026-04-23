import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, successResponse, handleApiError, errorResponse } from '@/lib/api/helpers';

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin']);
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.serviceId || !data.name || typeof data.price !== 'number' || typeof data.duration !== 'number') {
      return errorResponse('serviceId, name, price, and duration are required', 400);
    }
    
    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id: data.serviceId }
    });
    
    if (!service) {
      return errorResponse('Service not found', 404);
    }
    
    const addOn = await prisma.serviceAddOn.create({
      data: {
        serviceId: data.serviceId,
        name: data.name,
        price: data.price,
        duration: data.duration,
        description: data.description
      }
    });
    
    return successResponse({ addOn, message: 'Add-on créé avec succès' });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'worker', 'client']);
    
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    
    if (!serviceId) {
      return errorResponse('serviceId is required', 400);
    }
    
    const addOns = await prisma.serviceAddOn.findMany({
      where: { serviceId },
      orderBy: { createdAt: 'asc' }
    });
    
    return successResponse(addOns);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole(['admin']);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return errorResponse('id is required', 400);
    }
    
    const updates = await request.json();

    if (!updates.name && typeof updates.price !== 'number' && typeof updates.duration !== 'number' && !updates.description) {
      return errorResponse('At least one field (name, price, duration, description) must be provided for update', 400);
    }
    
    const addOn = await prisma.serviceAddOn.update({
      where: { id },
      data: updates
    });
    
    return successResponse(addOn);
  } catch (error) {
    return handleApiError(error);
  }
}
