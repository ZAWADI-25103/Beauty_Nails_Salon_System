import { NextRequest } from 'next/server';
import { requireRole, successResponse, handleApiError, errorResponse } from '@/lib/api/helpers'; // Reusing helpers from your existing route.ts
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, 
  context: { params: Promise<{ id: string; }>; }
  ) {
    try {
      const id = (await context.params).id;
      await requireRole(['admin', 'worker']);

    // Fetch the worker profile including related user data
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { id }, // Assuming params.id is the userId
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            isActive: true,
          }
        },
        // You can include other related data if needed
        schedules: true,
        commissions: true,
      },
      cacheStrategy: { 
        ttl: 60,      // Fresh for 60 seconds
        swr: 30,      // For another 30s, serve old data while updating in background
      },
    });

    if (!workerProfile) {
      return errorResponse('Profil employé non trouvé', 404);
    }

    // Note: The response shape should match the expected frontend interface
    // Adjust fields based on your Prisma schema and frontend needs
    const responseData = {
      id: workerProfile.id,
      userId: workerProfile.userId,
      position: workerProfile.position,
      specialties: workerProfile.specialties,
      commissionRate: workerProfile.commissionRate,
      rating: workerProfile.rating,
      bio: workerProfile.bio,
      totalReviews: workerProfile.totalReviews,
      isAvailable: workerProfile.isAvailable,
      workingHours: workerProfile.workingHours, // This is JSON in your schema
      hireDate: workerProfile.hireDate.toISOString(),
      createdAt: workerProfile.createdAt.toISOString(),
      updatedAt: workerProfile.updatedAt.toISOString(),
      user: workerProfile.user,
      commissionType: workerProfile.commissionType,
      commissionFrequency: workerProfile.commissionFrequency,
      commissionDay: workerProfile.commissionDay,
      minimumPayout: workerProfile.minimumPayout,
      lastCommissionPaidAt: workerProfile.lastCommissionPaidAt ? workerProfile.lastCommissionPaidAt.toISOString() : null,
    };

    return successResponse(responseData);
  } catch (error) {
    console.error('Error fetching worker profile:', error);
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, 
  context: { params: Promise<{ id: string; }>; }
  ) {
    try {
      const id = (await context.params).id;
      await requireRole(['admin', 'worker']);

    const body = await request.json();
    // Destructure allowed fields to prevent overposting
    const { position, specialties, bio, isAvailable, workingHours, commissionRate, commissionType, commissionFrequency, commissionDay, minimumPayout, lastCommissionPaidAt } = body;

    // Prepare data for Prisma update
    let updateData: any = {};
    if (position !== undefined) updateData.position = position;
    if (specialties !== undefined) updateData.specialties = specialties;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (workingHours !== undefined) updateData.workingHours = workingHours;
    if (bio !== undefined) updateData.bio = bio;
    // Add these if the fields exist in the schema later:
    if (commissionRate !== undefined) updateData.commissionRate = commissionRate;
    if (commissionType !== undefined) updateData.commissionType = commissionType;
    if (commissionFrequency !== undefined) updateData.commissionFrequency = commissionFrequency;
    if (commissionDay !== undefined) updateData.commissionDay = commissionDay;
    if (minimumPayout !== undefined) updateData.minimumPayout = minimumPayout;
    if (lastCommissionPaidAt !== undefined) updateData.lastCommissionPaidAt = lastCommissionPaidAt ? new Date(lastCommissionPaidAt) : null;

    // Find the worker profile to get the associated user ID
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { id: id },
      select: { id: true },
      cacheStrategy: { 
        ttl: 60,      // Fresh for 60 seconds
        swr: 30,      // For another 30s, serve old data while updating in background
      },
    });

    if (!workerProfile) {
      return errorResponse('Profil employé non trouvé', 404);
    }

    // Update the WorkerProfile
    const updatedWorkerProfile = await prisma.workerProfile.update({
      where: { id: workerProfile.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          }
        }
      },
    });

    // Also potentially update user details if provided in the request
    // Only allow updating name, email, phone, avatar through this specific endpoint if intended
    // Be careful about allowing sensitive changes like email/phone without verification here.
    if (body.name || body.email || body.phone) {
      await prisma.user.update({
        where: { id: updatedWorkerProfile.userId },
        data: { name: body.name, email: body.email, phone: body.phone }
      });
    }

    const responseData = {
      id: updatedWorkerProfile.id,
      userId: updatedWorkerProfile.userId,
      position: updatedWorkerProfile.position,
      specialties: updatedWorkerProfile.specialties,
      commissionRate: updatedWorkerProfile.commissionRate,
      rating: updatedWorkerProfile.rating,
      bio: updatedWorkerProfile.bio,
      totalReviews: updatedWorkerProfile.totalReviews,
      isAvailable: updatedWorkerProfile.isAvailable,
      workingHours: updatedWorkerProfile.workingHours,
      hireDate: updatedWorkerProfile.hireDate.toISOString(),
      createdAt: updatedWorkerProfile.createdAt.toISOString(),
      updatedAt: updatedWorkerProfile.updatedAt.toISOString(),
      user: updatedWorkerProfile.user,
      commissionType: updatedWorkerProfile.commissionType,
      commissionFrequency: updatedWorkerProfile.commissionFrequency,
      commissionDay: updatedWorkerProfile.commissionDay,
      minimumPayout: updatedWorkerProfile.minimumPayout,
      lastCommissionPaidAt: updatedWorkerProfile.lastCommissionPaidAt ? updatedWorkerProfile.lastCommissionPaidAt.toISOString() : null,
    };

    return successResponse({ ...responseData, message: 'Profil mis à jour avec succès' });
  } catch (error) {
    console.error('Error updating worker profile:', error);
    return handleApiError(error);
  }
}