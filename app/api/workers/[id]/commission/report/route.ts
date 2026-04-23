// File: /app/api/workers/[id]/commission/report/route.ts
import { NextRequest } from 'next/server';
import { requireRole, successResponse, handleApiError, errorResponse } from '@/lib/api/helpers';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, 
  context: { params: Promise<{ id: string; }>; }
  ) {
    try {
      const id = (await context.params).id;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period'); // e.g., '2026-03' for March 2026

    // Validate period format if needed (YYYY-MM)
    if (period && !/^\d{4}-\d{2}$/.test(period)) {
        return errorResponse('Invalid period format. Expected YYYY-MM.', 400);
    }

    // Example logic to fetch commission data for the report
    // This depends heavily on how you calculate commissions and store periods.
    // Assuming Commission model has a 'period' field like 'YYYY-MM'.
    const commissions = await prisma.commission.findMany({
      where: {
        workerId: id,
        ...(period && { period }), // Filter by specific period if provided
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate totals for the report
    const totalEarned = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const totalRevenue = commissions.reduce((sum, c) => sum + c.totalRevenue, 0);
    const totalAppointments = commissions.reduce((sum, c) => sum + c.appointmentsCount, 0);
    const pendingAmount = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commissionAmount, 0);
    const paidAmount = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commissionAmount, 0);

    const reportData = {
      workerId: id,
      period: period || 'all',
      totalEarned,
      totalRevenue,
      totalAppointments,
      pendingAmount,
      paidAmount,
      commissionDetails: commissions.map(c => ({
        id: c.id,
        period: c.period,
        totalRevenue: c.totalRevenue,
        commissionRate: c.commissionRate,
        commissionAmount: c.commissionAmount,
        appointmentsCount: c.appointmentsCount,
        status: c.status,
        paidAt: c.paidAt ? c.paidAt.toISOString() : null,
        createdAt: c.createdAt.toISOString(),
      })),
    };

    return successResponse(reportData);
  } catch (error) {
    console.error('Error fetching commission report:', error);
    return handleApiError(error);
  }
}