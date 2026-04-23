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

    // Total active membership purchases
    const totalMembers = await prisma.membershipPurchase.count({ where: { status: 'active' } });

    // Counts by client tier
    const byTier = await prisma.clientProfile.groupBy({
      by: ['tier'],
      _count: { _all: true },
    }) as any[];

    const tierCounts: Record<string, number> = {};
    byTier.forEach((b) => {
      tierCounts[b.tier] = Number(b._count?._all || 0);
    });

    // Revenue split: member vs non-member
    // Find member client ids (have an active membership purchase)
    const members = await prisma.membershipPurchase.findMany({ 
      where: { status: 'active' }, 
      distinct: ['clientId'], 
      select: { clientId: true } 
    });
    const memberIds = members.map((m) => m.clientId);

    const salesWhere: any = { paymentStatus: 'completed' };
    if (range) salesWhere.createdAt = { gte: range.from, lte: range.to };

    const totalSales = await prisma.sale.findMany({ 
      where: salesWhere, 
      select: { total: true, clientId: true } 
    });
    
    const totalRevenue = totalSales.reduce((sum, r) => sum + Number(r.total), 0);
    const memberRevenue = totalSales.filter((s) => memberIds.includes(s.clientId))
      .reduce((sum, r) => sum + Number(r.total), 0);
    const nonMemberRevenue = totalRevenue - memberRevenue;

    // Get detailed membership data for PDF
    const detailedMembers = await prisma.membershipPurchase.findMany({
      where: { status: 'active' },
      include: {
        client: {
          select: {
            user: true,
          }
        },
        membership: {
          select: {
            name: true
          }
        }
      }
    });

    if (pdfTrigger) {
      // Format data for PDF
      const sections: ContentSection[] = [
        {
          title: 'Membership Report',
          type: 'keyValue',
          data: {
            'Period:': range ? `${format(range.from, 'MMM dd, yyyy')} - ${format(range.to, 'MMM dd, yyyy')}` : 'All Time',
            'Total Active Members:': totalMembers.toString(),
            'VIP Members:': tierCounts['VIP']?.toString() || '0',
            'Premium Members:': tierCounts['Premium']?.toString() || '0',
            'Regular Members:': tierCounts['Regular']?.toString() || '0',
            'Member Revenue:': `CDF ${memberRevenue.toLocaleString('fr-CD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            'Non-Member Revenue:': `CDF ${nonMemberRevenue.toLocaleString('fr-CD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          }
        },
        {
          title: 'Active Members',
          type: 'table',
          data: {
            headers: ['Client Name', 'Email', 'Membership Type', 'Start Date', 'End Date'],
            rows: detailedMembers.map((m: any) => [
              m.client?.user?.name || 'Unknown',
              m.client?.user?.email || 'N/A',
              m.membership?.name || 'N/A',
              m.startDate ? format(m.startDate, 'MMM dd, yyyy') : 'N/A',
              m.endDate ? format(m.endDate, 'MMM dd, yyyy') : 'N/A'
            ])
          }
        }
      ];

      // Generate PDF
      const pdfBuffer = await generateReportPdf(
        sections,
        'Beauty Nails - Membership Report',
        range ? `${format(range.from, 'MMM dd')} to ${format(range.to, 'MMM dd')}` : 'All Time'
      );

      // Return PDF response
      return new NextResponse(pdfBuffer.toString('binary'), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="membership-report-${format(new Date(), 'yyyy-MM-dd')}.pdf"`,
        },
      });
    }

    return successResponse({
      totalMembers,
      vip: tierCounts['VIP'] ?? 0,
      premium: tierCounts['Premium'] ?? 0,
      regular: tierCounts['Regular'] ?? 0,
      memberRevenue,
      nonMemberRevenue,
      averageMemberSpend: memberIds.length ? Math.round(memberRevenue / Math.max(1, memberIds.length)) : 0,
      averageNonMemberSpend: 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}