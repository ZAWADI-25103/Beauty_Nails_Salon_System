import { NextRequest } from 'next/server';
import { requireRole, successResponse, handleApiError, errorResponse } from '@/lib/api/helpers';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, 
  context: { params: Promise<{ id: string; }>; }
  ) {
    try {
      const id = (await context.params).id;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period'); // e.g., '2026-03'

    if (period && !/^\d{4}-\d{2}$/.test(period)) {
        return errorResponse('Invalid period format. Expected YYYY-MM.', 400);
    }

    // Example logic: Aggregate earnings from completed appointments
    // This is an alternative way to calculate earnings if not solely relying on the Commission model
    const startDate = period ? new Date(`${period}-01`) : new Date(0); // From beginning if no period
    const endDate = period ? new Date(`${period}-01`) : new Date(); // To now if no period
    if (period) {
        endDate.setMonth(endDate.getMonth() + 1); // End of the specified month
    }

    const completedAppointments = await prisma.appointment.findMany({
      where: {
        workerId: id,
        status: 'completed',
        date: {
          gte: startDate,
          lt: endDate,
        }
      },
      include: {
        service: true,
        client: {
            include: {
                user: true
            }
        }
      },
      cacheStrategy: { 
        ttl: 60,      // Fresh for 60 seconds
        swr: 30,      // For another 30s, serve old data while updating in background
      },
    });

    const workerProfile = await prisma.workerProfile.findUnique({
        where: { userId: id },
        select: { commissionRate: true },
        cacheStrategy: { 
          ttl: 60,      // Fresh for 60 seconds
          swr: 30,      // For another 30s, serve old data while updating in background
        },
    });

    if (!workerProfile) {
        return errorResponse('Profil employé non trouvé', 404);
    }

    const totalRevenue = completedAppointments.reduce((sum: any, apt: any) => sum + (apt.price || 0), 0);
    const estimatedEarnings = totalRevenue * (workerProfile.commissionRate / 100);

    const statementData = {
      workerId: id,
      period: period || 'all',
      totalRevenue,
      estimatedEarnings, // This is an estimate based on current rate
      appointmentsCount: completedAppointments.length,
      details: completedAppointments.map((apt: any) => ({
        id: apt.id,
        date: apt.date.toISOString(),
        time: apt.time,
        clientName: apt.client.user.name,
        serviceName: apt.service.name,
        price: apt.price,
        commissionEarned: (apt.price || 0) * (workerProfile.commissionRate / 100),
      })),
    };

    return successResponse(statementData);
  } catch (error) {
    console.error('Error fetching earnings statement:', error);
    return handleApiError(error);
  }
}