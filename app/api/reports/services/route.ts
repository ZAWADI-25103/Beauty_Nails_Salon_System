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

    // ✅ Fetch ONLY completed + paid appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        date: { gte: startDate },
        status: {
          in: ['completed', 'confirmed']
        },
        sale: {
          paymentStatus: 'completed'
        }
      },
      include: {
        sale: {
          include: {
            items: {
              include: {
                service: true
              }
            }
          }
        }
      }
    });

    // ✅ Aggregate from paid appointments
    const serviceStats: Record<string, any> = {};

    // console.log(appointments);

    appointments.forEach((appointment: any) => {
      appointment.sale?.items.forEach((item: any) => {
        const service = item.service;
        if (!service) return;

        if (!serviceStats[service.id]) {
          serviceStats[service.id] = {
            id: service.id,
            name: service.name,
            category: service.category,
            count: 0,
            revenue: 0,
            avgPrice: 0,
            growth: '0%'
          };
        }

        serviceStats[service.id].count += item.quantity;
        serviceStats[service.id].revenue += Number(item.price) * item.quantity;
      });
    });

    // Calculate avg price
    Object.values(serviceStats).forEach((service: any) => {
      service.avgPrice =
        service.count > 0 ? service.revenue / service.count : 0;
    });

    // Include zero-sale active services
    const allServices = await prisma.service.findMany({
      where: { isActive: true }
    });

    allServices.forEach((service) => {
      if (!serviceStats[service.id]) {
        serviceStats[service.id] = {
          id: service.id,
          name: service.name,
          category: service.category,
          count: 0,
          revenue: 0,
          avgPrice: 0,
          growth: '0%'
        };
      }
    });

    const servicesByRevenue = Object.values(serviceStats).sort(
      (a: any, b: any) => b.revenue - a.revenue
    );

    const mostPopular = servicesByRevenue[0] || null;

    const responseData = {
      services: servicesByRevenue.map((service: any) => ({
        id: service.id,
        name: service.name,
        category: service.category,
        count: service.count,
        revenue: service.revenue,
        avgPrice: service.avgPrice,
        growth: service.count > 0 ? ((service.revenue / service.count) / service.avgPrice * 100).toFixed(2) + '%' : '0%'
      })),
      mostPopular
    };

    // console.log(responseData);

    // ================= PDF =================
    if (pdfTrigger) {
      const totalRevenue = servicesByRevenue.reduce(
        (sum: number, s: any) => sum + s.revenue,
        0
      );

      const sections: ContentSection[] = [
        {
          title: 'Service Performance Report',
          type: 'keyValue',
          data: {
            'Period:': period,
            'Total Services:': allServices.length.toString(),
            'Active Services Sold:': servicesByRevenue
              .filter((s: any) => s.count > 0)
              .length.toString(),
            'Most Popular Service:': mostPopular?.name || 'None',
            'Total Revenue:': `CDF ${totalRevenue.toLocaleString('fr-CD', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`
          }
        },
        {
          title: 'Top Performing Services',
          type: 'table',
          data: {
            headers: ['Service', 'Category', 'Sales Count', 'Revenue', 'Avg Price'],
            rows: servicesByRevenue.slice(0, 10).map((service: any) => [
              service.name,
              service.category,
              service.count.toString(),
              `CDF ${service.revenue.toLocaleString('fr-CD', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`,
              `CDF ${service.avgPrice.toLocaleString('fr-CD', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`
            ])
          }
        }
      ];

      const pdfBuffer = await generateReportPdf(
        sections,
        'Beauty Nails - Service Performance Report',
        `${period.charAt(0).toUpperCase() + period.slice(1)} (${format(
          startDate,
          'MMM dd, yyyy'
        )} - ${format(now, 'MMM dd, yyyy')})`
      );

      return new NextResponse(pdfBuffer.toString('binary'), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="service-performance-report-${period}-${format(
            new Date(),
            'yyyy-MM-dd'
          )}.pdf"`
        }
      });
    }

    return successResponse(responseData);
  } catch (error) {
    return handleApiError(error);
  }
}