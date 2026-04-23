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

    // Optimized query to get appointment times with service and client info
    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: range.from,
          lte: range.to,
        },
        status: 'completed',
      },
      select: { 
        time: true,
        date: true,
        service: {
          select: {
            name: true,
            category: true
          }
        },
        client: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
              }
            },
          }
        }
      },
    });

    const buckets: Record<string, number> = {};
    const categoryBreakdown: Record<string, number> = {};
    
    appointments.forEach((a: any) => {
      // Time format "HH:MM" stored as string
      const hour = (a.time || '').slice(0,5);
      buckets[hour] = (buckets[hour] || 0) + 1;
      
      // Count by category
      if (a.service?.category) {
        categoryBreakdown[a.service.category] = (categoryBreakdown[a.service.category] || 0) + 1;
      }
    });

    const peakHours = Object.entries(buckets).map(([hour, bookings]) => ({ hour, bookings }));
    // Sort by hour
    peakHours.sort((a, b) => a.hour.localeCompare(b.hour));

    // Find peak hour
    const peakHour = peakHours.reduce((max, current) => current.bookings > max.bookings ? current : max, { hour: '', bookings: 0 });

    if (pdfTrigger) {
      // Format data for PDF
      const sections: ContentSection[] = [
        {
          title: 'Peak Hours Report',
          type: 'keyValue',
          data: {
            'Period:': `${format(range.from, 'MMM dd, yyyy')} - ${format(range.to, 'MMM dd, yyyy')}`,
            'Total Appointments:': appointments.length.toString(),
            'Peak Hour:': peakHour.hour,
            'Bookings in Peak Hour:': peakHour.bookings.toString()
          }
        },
        {
          title: 'Peak Hours Distribution',
          type: 'table',
          data: {
            headers: ['Hour', 'Bookings'],
            rows: peakHours.map(ph => [
              ph.hour,
              ph.bookings.toString()
            ])
          }
        },
        {
          title: 'Service Category Breakdown',
          type: 'table',
          data: {
            headers: ['Category', 'Bookings'],
            rows: Object.entries(categoryBreakdown).map(([category, count]) => [
              category,
              count.toString()
            ])
          }
        }
      ];

      // Generate PDF
      const pdfBuffer = await generateReportPdf(
        sections,
        'Beauty Nails - Peak Hours Report',
        `${format(range.from, 'MMM dd')} to ${format(range.to, 'MMM dd')}`
      );

      // Return PDF response
      return new NextResponse(pdfBuffer.toString('binary'), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="peak-hours-report-${format(new Date(), 'yyyy-MM-dd')}.pdf"`,
        },
      });
    }

    return successResponse({
      peakHours,
      summary: {
        totalAppointments: appointments.length,
        peakHour,
        categoryBreakdown
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}