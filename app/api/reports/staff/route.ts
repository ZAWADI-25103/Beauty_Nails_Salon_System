import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, successResponse, handleApiError, errorResponse } from '@/lib/api/helpers';
import { format } from 'date-fns';
import { ContentSection, generateReportPdf } from '@/lib/pdf/jsPdfGenerator';

function parseRange(searchParams: URLSearchParams) {
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  if (!from || !to) return null;
  return { from: new Date(from), to: new Date(to) };
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin']);

    const { searchParams } = new URL(request.url);
    const range = parseRange(searchParams);
    if (!range) return errorResponse('Dates requises', 400);

    const pdfTrigger = searchParams.get('pdfTrigger') === 'true';

    // Get all workers with their profiles
    const workers = await prisma.workerProfile.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        appointments: {
          where: {
            date: {
              gte: range.from,
              lte: range.to,
            },
            status: 'completed',
          },
          include: {
            service: true,
            sale: true
          }
        },
        commissions: {
          where: {
            createdAt: {
              gte: range.from,
              lte: range.to,
            }
          }
        }
      }
    });

    // Calculate performance metrics for each worker
    const workerStats = workers.map((worker : any) => {
      const completedAppointments = worker.appointments.length;
      const totalRevenue = worker.appointments.reduce((sum: any, appt: any) => {
        return sum + (appt.sale ? Number(appt.sale.total) : 0);
      }, 0);
      
      const totalCommission = worker.commissions.reduce((sum: any, comm: any) => {
        return sum + Number(comm.commissionAmount);
      }, 0);

      return {
        id: worker.id,
        name: worker.user?.name || 'Unknown',
        position: worker.position,
        specialties: worker.specialties,
        completedAppointments,
        totalRevenue,
        totalCommission,
        averageRevenuePerAppointment: completedAppointments > 0 ? totalRevenue / completedAppointments : 0,
        commissionRate: worker.commissionRate
      };
    });

    // Calculate overall summary
    const summary = {
      totalWorkers: workers.length,
      totalAppointments: workerStats.reduce((sum, ws) => sum + ws.completedAppointments, 0),
      totalRevenue: workerStats.reduce((sum, ws) => sum + ws.totalRevenue, 0),
      totalCommission: workerStats.reduce((sum, ws) => sum + ws.totalCommission, 0)
    };

    if (pdfTrigger) {
      // Format data for PDF
      const sections: ContentSection[] = [
        {
          title: 'Staff Performance Report',
          type: 'keyValue',
          data: {
            'Period:': `${format(range.from, 'MMM dd, yyyy')} - ${format(range.to, 'MMM dd, yyyy')}`,
            'Total Workers:': summary.totalWorkers.toString(),
            'Total Appointments:': summary.totalAppointments.toString(),
            'Total Revenue:': `CDF ${summary.totalRevenue.toLocaleString('fr-CD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            'Total Commission:': `CDF ${summary.totalCommission.toLocaleString('fr-CD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          }
        },
        {
          title: 'Staff Performance Details',
          type: 'table',
          data: {
            headers: ['Name', 'Position', 'Appointments', 'Revenue', 'Commission', 'Avg Revenue/Appointment'],
            rows: workerStats.map(ws => [
              ws.name,
              ws.position,
              ws.completedAppointments.toString(),
              `CDF ${ws.totalRevenue.toLocaleString('fr-CD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              `CDF ${ws.totalCommission.toLocaleString('fr-CD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              `CDF ${ws.averageRevenuePerAppointment.toLocaleString('fr-CD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            ])
          }
        }
      ];

      // Generate PDF
      const pdfBuffer = await generateReportPdf(
        sections,
        'Beauty Nails - Staff Performance Report',
        `${format(range.from, 'MMM dd')} to ${format(range.to, 'MMM dd')}`
      );

      // Return PDF response
      return new NextResponse(pdfBuffer.toString('binary'), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="staff-performance-report-${format(new Date(), 'yyyy-MM-dd')}.pdf"`,
        },
      });
    }

    return successResponse({
      workers: workerStats,
      summary
    });
  } catch (error) {
    return handleApiError(error);
  }
}