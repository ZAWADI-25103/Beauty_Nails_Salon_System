"use server"
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError, requireRole } from '@/lib/api/helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const onlineBookable = searchParams.get('onlineBookable');

    const where: any = { isActive: true };

    if (category) {
      where.category = category;
    }

    if (onlineBookable !== null) {
      where.onlineBookable = onlineBookable === 'true';
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        addOns: true,
      },
      orderBy: [
        { isPopular: 'desc' },
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
      cacheStrategy: { 
        ttl: 60,      // Fresh for 60 seconds
        swr: 30,      // For another 30s, serve old data while updating in background
      },
    });

    return successResponse(services);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin']);

    const body = await request.json();
    const {
      name,
      category,
      price,
      commission,
      duration,
      description,
      imageUrl,
      onlineBookable = true,
      isPopular = false,
    } = body;

    const service = await prisma.service.create({
      data: {
        name,
        category,
        price,
        workerCommission: commission,
        duration,
        description,
        imageUrl,
        onlineBookable,
        isPopular,
      },
    });

    return successResponse(
      {
        service,
        message: 'Service créé avec succès',
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}