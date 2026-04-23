"use server"
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, successResponse, handleApiError } from '@/lib/api/helpers';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string; }>; }
) {
  try {
    const id = (await context.params).id;
    await requireRole(['admin', 'worker']);

    const schedule = await prisma.workerSchedule.findMany({
      where: { workerId: id },
      orderBy: { dayOfWeek: 'asc' },
    });

    const worker = await prisma.workerProfile.findUnique({
      where: { id: id },
      select: {
        workingHours: true,
      },
      cacheStrategy: { 
        ttl: 60,      // Fresh for 60 seconds
        swr: 30,      // For another 30s, serve old data while updating in background
      },
    });

    return successResponse({
      schedule,
      workingHours: worker?.workingHours,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; }>; }
  ) {
    try {
      const id = (await context.params).id;
    await requireRole(['admin', 'worker']);

    const body = await request.json();
    const { dayOfWeek, startTime, endTime, isAvailable } = body;

    const schedule = await prisma.workerSchedule.upsert({
      where: {
        workerId_dayOfWeek: {
          workerId: id,
          dayOfWeek,
        },
      },
      update: {
        startTime,
        endTime,
        isAvailable,
      },
      create: {
        workerId: id,
        dayOfWeek,
        startTime,
        endTime,
        isAvailable,
      },
    });

    return successResponse({
      message: 'Horaire mis à jour',
      schedule,
    });
  } catch (error) {
    return handleApiError(error);
  }
}