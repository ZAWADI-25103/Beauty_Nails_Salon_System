"use server"
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, successResponse, handleApiError, errorResponse } from '@/lib/api/helpers';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await context.params).id;
    await requireRole(['admin', 'worker']);

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'weekly';

    // Get worker profile
    const worker = await prisma.workerProfile.findUnique({
      where: { id },
    });

    if (!worker) {
      return errorResponse('Employé non trouvé', 404);
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();

    if (worker.commissionFrequency === 'weekly') {
      startDate.setDate(now.getDate() - now.getDay()); // Start of current week
    } else if (worker.commissionFrequency === 'monthly') {
      startDate.setDate(1); // Start of current month
    } else if (worker.commissionFrequency === 'daily') {
      startDate.setDate(now.getDate()); // Start of today
    }

    const commissions = await prisma.commission.findMany({
      where: {
        workerId: id,
        createdAt: {
          gte: startDate,
        },
      },
      cacheStrategy: { 
        ttl: 60,      // Fresh for 60 seconds
        swr: 30,      // For another 30s, serve old data while updating in background
      },
    });

    const totalEarnings = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const totalBusiness = commissions.reduce((sum, c) => {

      const buzRate = 100 - c.commissionRate
      const buzEarnings = c.totalRevenue * buzRate / 100

      return sum + buzEarnings
    }, 0);
    const totalRevenue = commissions.reduce((sum, c) => sum + c.totalRevenue, 0);
    const matCost = totalBusiness * 0.5;
    const operaCost = totalBusiness * 0.5;
    const appointmentsCount = commissions.reduce((sum, c) => sum + c.appointmentsCount, 0);

    // console.log({
    //   commission: totalEarnings,
    //   totalBusiness,
    //   matCost,
    //   operaCost,
    //   totalRevenue,
    //   appointmentsCount,
    //   period,
    //   startDate: startDate.toISOString(),
    //   endDate: now.toISOString(),
    // })

    return successResponse({
      commission: totalEarnings,
      totalBusiness,
      matCost,
      operaCost,
      totalRevenue,
      appointmentsCount,
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
