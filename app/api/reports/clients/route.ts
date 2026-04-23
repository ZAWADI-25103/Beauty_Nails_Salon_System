import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, successResponse, handleApiError } from '@/lib/api/helpers';
import { format } from 'date-fns';
import { ContentSection, generateReportPdf } from '@/lib/pdf/jsPdfGenerator';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin']);

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const pdfTrigger = searchParams.get('pdfTrigger') === 'true';

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date(now);
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // // Get total clients
    // const totalClients = await prisma.clientProfile.count({
    //   where: {
    //     createdAt: {
    //       gte: startDate
    //     }
    //   }
    // });

    // // Get new clients in the period
    // const newClients = await prisma.clientProfile.count({
    //   where: {
    //     createdAt: {
    //       gte: startDate
    //     }
    //   }
    // });

    // Get completed appointments in the period
    const completedAppointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: startDate
        },
        status: 'completed'
      },
      include: {
        client: {
          include: {
            user: true
          }
        },
        sale: true
      }
    });

    // 1. Correct Total Clients count
    const totalClients = await prisma.clientProfile.count();

    // 2. Dynamic Previous Period Offset
    const periodDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const prevPeriodStart = new Date(startDate);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - periodDays);
    const prevPeriodEnd = new Date(startDate);

    // 3. Get New Clients (those created during the current period)
    const newClients = await prisma.clientProfile.count({
      where: { createdAt: { gte: startDate } }
    });

    // 4. Get Unique Clients from Previous Period
    const prevPeriodClients = await prisma.appointment.findMany({
      where: {
        date: { gte: prevPeriodStart, lte: prevPeriodEnd },
        status: 'completed'
      },
      select: { clientId: true },
      distinct: ['clientId']
    });

    const prevClientIds = new Set(prevPeriodClients.map(appt => appt.clientId));

    console.log('Previous Period Client IDs:', prevClientIds);

    // 5. Calculate Retention
    const currentPeriodClients = new Set(completedAppointments.map(appt => appt.clientId));
    const retainedClients = Array.from(prevClientIds).filter(id => currentPeriodClients.has(id));

    // Rate = (Retained / Total who visited in previous period)
    const retentionRate = prevClientIds.size > 0 
      ? (retainedClients.length / prevClientIds.size) * 100 
      : 10;


    // Calculate client performance metrics
    const clientStats = completedAppointments.reduce((acc: any, appointment: any) => {
      const clientId = appointment.clientId;
      if (!acc[clientId]) {
        acc[clientId] = {
          clientId,
          clientName: appointment.client?.user?.name || 'Unknown',
          appointmentCount: appointment.client?.totalAppointments || 0,
          totalRevenue: appointment.client?.totalSpent ? Number(appointment.client.totalSpent) : 0
        };
      }
      
      // acc[clientId].appointmentCount += 1;
      // acc[clientId].totalRevenue += appointment.sale ? Number(appointment.sale.total) : 0;
      
      return acc;
    }, {});

    // Get top clients by appointment count and revenue
    const sortedByAppointments = Object.values(clientStats)
      .sort((a: any, b: any) => b.appointmentCount - a.appointmentCount)
      .slice(0, 10);

    const sortedByRevenue = Object.values(clientStats)
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    const topClients = [...new Set([...sortedByAppointments, ...sortedByRevenue])]
      .slice(0, 10);

    const responseData = {
      totalClients,
      newClients,
      retentionRate,
      topClients: topClients.map((client: any) => ({
        id: client.clientId,
        name: client.clientName,
        appointmentCount: client.appointmentCount,
        totalRevenue: client.totalRevenue
      }))
    };

    // console.log('Client Analytics Response:', responseData);

    if (pdfTrigger) {
      // Format data for PDF
      const sections: ContentSection[] = [
        {
          title: 'Client Analytics Report',
          type: 'keyValue',
          data: {
            'Period:': period,
            'Total Clients:': totalClients.toString(),
            'New Clients:': newClients.toString(),
            'Retention Rate:': `${retentionRate.toFixed(2)}%`,
            'Active Clients:': completedAppointments.length.toString()
          }
        },
        {
          title: 'Top Clients by Appointment Count',
          type: 'table',
          data: {
            headers: ['Client Name', 'Appointments', 'Revenue'],
            rows: sortedByAppointments.map((client: any) => [
              client.clientName,
              client.appointmentCount.toString(),
              `CDF ${client.totalRevenue.toLocaleString('fr-CD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            ])
          }
        },
        {
          title: 'Top Clients by Revenue',
          type: 'table',
          data: {
            headers: ['Client Name', 'Revenue', 'Appointments'],
            rows: sortedByRevenue.map((client: any) => [
              client.clientName,
              `CDF ${client.totalRevenue.toLocaleString('fr-CD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              client.appointmentCount.toString()
            ])
          }
        }
      ];

      // Generate PDF
      const pdfBuffer = await generateReportPdf(
        sections,
        'Beauty Nails - Client Analytics Report',
        `${period.charAt(0).toUpperCase() + period.slice(1)} (${format(startDate, 'MMM dd, yyyy')} - ${format(now, 'MMM dd, yyyy')})`
      );

      // Return PDF response
      return new NextResponse(pdfBuffer.toString('binary'), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="client-analytics-report-${period}-${format(new Date(), 'yyyy-MM-dd')}.pdf"`,
        },
      });
    }

    return successResponse(responseData);
  } catch (error) {
    return handleApiError(error);
  }
}