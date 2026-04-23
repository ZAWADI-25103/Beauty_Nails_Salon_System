import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, successResponse, handleApiError } from '@/lib/api/helpers';
import { format } from 'date-fns';
import { ContentSection, generateReportPdf } from '@/lib/pdf/jsPdfGenerator';

function parseRange(searchParams: URLSearchParams) {
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  return from && to ? { from: new Date(from), to: new Date(to) } : null;
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin']);

    const { searchParams } = new URL(request.url);
    const range = parseRange(searchParams);
    const pdfTrigger = searchParams.get('pdfTrigger') === 'true';

    const where: any = {};
    if (range) where.sentDate = { gte: range.from, lte: range.to };

    const campaigns = await prisma.marketingCampaign.findMany({ 
      where, 
      orderBy: { sentDate: 'desc' },
    });

    // Compute conversions and revenue for each campaign using a 7-day attribution window after sentDate
    const results = await Promise.all(campaigns.map(async (c) => {
      let conversions = 0;
      let revenue = 0;
      
      if (c.sentDate) {
        const start = c.sentDate;
        const end = new Date(c.sentDate);
        end.setDate(end.getDate() + 7);
        
        const sales = await prisma.sale.findMany({ 
          where: { 
            createdAt: { gte: start, lte: end }, 
            paymentStatus: 'completed' 
          }, 
          select: { total: true } 
        });
        
        conversions = sales.length;
        revenue = sales.reduce((sum, r) => sum + Number(r.total), 0);
      }
      
      return {
        id: c.id,
        name: c.name,
        recipients: c.recipients,
        openRate: c.openRate ?? 0,
        clickRate: c.clickRate ?? 0,
        scheduledDate: c.scheduledDate,
        sentDate: c.sentDate,
        status: c.status,
        conversions,
        revenue,
      };
    }));

    // Calculate summary statistics
    const totalConversions = results.reduce((sum, c) => sum + c.conversions, 0);
    const totalRevenue = results.reduce((sum, c) => sum + c.revenue, 0);
    const avgConversionRate = totalConversions / Math.max(results.length, 1);
    const avgRevenuePerCampaign = totalRevenue / Math.max(results.length, 1);

    if (pdfTrigger) {
      // Format data for PDF
      const sections: ContentSection[] = [
        {
          title: 'Marketing Campaigns Report',
          type: 'keyValue',
          data: {
            'Period:': range ? `${format(range.from, 'MMM dd, yyyy')} - ${format(range.to, 'MMM dd, yyyy')}` : 'All Time',
            'Total Campaigns:': campaigns.length.toString(),
            'Total Conversions:': totalConversions.toString(),
            'Total Revenue:': `CDF ${totalRevenue.toLocaleString('fr-CD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          }
        },
        {
          title: 'Campaign Performance',
          type: 'table',
          data: {
            headers: ['Name', 'Recipients', 'Open Rate', 'Click Rate', 'Conversions', 'Revenue'],
            rows: results.map(c => [
              c.name,
              c.recipients?.toString() || '0',
              `${((Number(c.openRate) || 0) * 100).toFixed(2)}%`,
              `${((Number(c.clickRate) || 0) * 100).toFixed(2)}%`,
              c.conversions.toString(),
              `CDF ${c.revenue.toLocaleString('fr-CD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            ])
          }
        }
      ];

      // Generate PDF
      const pdfBuffer = await generateReportPdf(
        sections,
        'Beauty Nails - Marketing Campaigns Report',
        range ? `${format(range.from, 'MMM dd')} to ${format(range.to, 'MMM dd')}` : 'All Time'
      );

      // Return PDF response
      // Return PDF response
      return new NextResponse(pdfBuffer.toString('binary'), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="marketing-campaigns-report-${format(new Date(), 'yyyy-MM-dd')}.pdf"`,
        },
      });
    }

    return successResponse({
      campaigns: results,
      summary: {
        totalConversions,
        totalRevenue,
        avgConversionRate,
        avgRevenuePerCampaign
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}