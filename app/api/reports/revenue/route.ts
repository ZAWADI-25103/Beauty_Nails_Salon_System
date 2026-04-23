import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, successResponse, handleApiError, errorResponse } from '@/lib/api/helpers';
import { endOfDay, format, startOfDay } from 'date-fns';
import { ContentSection, generateReportPdf } from '@/lib/pdf/jsPdfGenerator';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin']);

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const pdfTrigger = searchParams.get('pdfTrigger') === 'true';

    if (!fromParam || !toParam) {
      return errorResponse('Dates requises', 400);
    }

    // 1. Convert params to Date objects, then force start/end of day
    const from = startOfDay(new Date(fromParam));
    const to = endOfDay(new Date(toParam));

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return errorResponse('Dates invalides', 400);
    }

    console.log("dates: ",{
      from,
      to
    })

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to,
        },
        paymentStatus: {
          in: ['completed', 'pending'],
        },
      },
      include: {
        items: {
          include: {
            service: true,
          },
        },
        client: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        payments: {
          select: {
            method: true,
            amount: true,
          },
        },
      },
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);

    // 🔹 Monthly Breakdown for LineChart (YYYY-MM)
    const monthlyBreakdown: Record<string, number> = {};
    sales.forEach((sale) => {
      const monthKey = sale.createdAt.toISOString().slice(0, 7);
      monthlyBreakdown[monthKey] =
        (monthlyBreakdown[monthKey] || 0) + Number(sale.total);
    });

    // 🔹 Revenue by Service Category
    const breakdown: Record<string, number> = {};
    const serviceCount: Record<string, number> = {};

    sales.forEach((sale: any) => {
      for (const item of sale.items) {
        const category = item.service.category;
        const price = Number(item.price);
        const quantity = item.quantity;

        breakdown[category] =
          (breakdown[category] || 0) + price * quantity;

        serviceCount[item.service.name] =
          (serviceCount[item.service.name] || 0) + quantity;
      }
    });

    const topSellingServices = Object.entries(serviceCount)
      .sort(([, a], [, b]) => Number(b) - Number(a))
      .slice(0, 10);

    const paymentMethods: Record<string, number> = {};
    sales.forEach((sale: any) => {
      if (sale.payments && sale.payments.length > 0) {
        sale.payments.forEach((payment: any) => {
          paymentMethods[payment.method] =
            (paymentMethods[payment.method] || 0) + Number(payment.amount);
        });
      }
    });

    if (pdfTrigger) {
      const sections: ContentSection[] = [
        {
          title: 'Revenue Report',
          type: 'keyValue',
          data: {
            'Period:': `${format(from, 'MMM dd, yyyy')} - ${format(to, 'MMM dd, yyyy')}`,
            'Total Revenue:': `CDF ${totalRevenue.toLocaleString('fr-CD', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
            'Total Sales:': sales.length.toString(),
            'Average Sale Value:': `CDF ${(totalRevenue / Math.max(sales.length, 1)).toLocaleString(
              'fr-CD',
              { minimumFractionDigits: 2, maximumFractionDigits: 2 }
            )}`,
          },
        },
        {
          title: 'Monthly Revenue Breakdown',
          type: 'table',
          data: {
            headers: ['Month (YYYY-MM)', 'Revenue'],
            rows: Object.entries(monthlyBreakdown).map(([month, revenue]) => [
              month,
              `CDF ${revenue.toLocaleString('fr-CD', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
            ]),
          },
        },
        {
          title: 'Revenue by Service Category',
          type: 'table',
          data: {
            headers: ['Category', 'Revenue'],
            rows: Object.entries(breakdown).map(([category, revenue]) => [
              category,
              `CDF ${revenue.toLocaleString('fr-CD', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
            ]),
          },
        },
        {
          title: 'Top Selling Services',
          type: 'table',
          data: {
            headers: ['Service', 'Quantity Sold'],
            rows: topSellingServices.map(([service, quantity]) => [
              service,
              quantity.toString(),
            ]),
          },
        },
        {
          title: 'Payment Methods',
          type: 'table',
          data: {
            headers: ['Method', 'Amount'],
            rows: Object.entries(paymentMethods).map(([method, amount]) => [
              method,
              `CDF ${amount.toLocaleString('fr-CD', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
            ]),
          },
        },
      ];

      const pdfBuffer = await generateReportPdf(
        sections,
        'Beauty Nails - Revenue Report',
        `${format(from, 'MMM dd')} to ${format(to, 'MMM dd')}`
      );

      return new NextResponse(pdfBuffer.toString('binary'), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="revenue-report-${format(
            new Date(),
            'yyyy-MM-dd'
          )}.pdf"`,
        },
      });
    }

    console.log({
      totalRevenue,
      salesCount: sales.length,
      breakdown,
      monthlyBreakdown, // ✅ Added for LineChart
      serviceCount,
      topSellingServices,
      paymentMethods,
      period: { from: fromParam, to: toParam },
    })

    return successResponse({
      totalRevenue,
      salesCount: sales.length,
      breakdown,
      monthlyBreakdown, // ✅ Added for LineChart
      serviceCount,
      topSellingServices,
      paymentMethods,
      period: { from: fromParam, to: toParam },
    });
  } catch (error) {
    return handleApiError(error);
  }
}