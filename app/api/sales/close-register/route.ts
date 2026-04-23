import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, actualCash, expectedCash } = body;

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all completed sales for the day
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        paymentStatus: 'completed',
      },
      include: {
        payments: true,
      },
      cacheStrategy: { 
        ttl: 60,      // Fresh for 60 seconds
        swr: 30,      // For another 30s, serve old data while updating in background
      },
    });

    let totalSales = 0;
    let cashSales = 0;
    let cardSales = 0;
    let mobileSales = 0;

    sales.forEach((sale: any) => {
      totalSales += sale.total;
      sale.payments.forEach((payment: any) => {
        if (payment.status === 'completed') {
          if (payment.method === 'cash') cashSales += payment.amount;
          else if (payment.method === 'card') cardSales += payment.amount;
          else if (payment.method === 'mobile') mobileSales += payment.amount;
        }
      });
    });

    const discrepancy = actualCash - expectedCash;

    // Save daily register
    const register = await prisma.dailyRegister.upsert({
      where: { date: startOfDay },
      update: {
        closingCash: actualCash,
        expectedCash: expectedCash,
        discrepancy,
        totalSales,
        cashSales,
        cardSales,
        mobileSales,
        closedAt: new Date(),
      },
      create: {
        date: startOfDay,
        openingCash: 0, // Could be improved by fetching previous day closing
        closingCash: actualCash,
        expectedCash: expectedCash,
        discrepancy,
        totalSales,
        cashSales,
        cardSales,
        mobileSales,
        closedAt: new Date(),
      },
    });

    return NextResponse.json({
      totalSales,
      cashSales,
      cardSales,
      mobileSales,
      discrepancy,
      register,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to close register' } },
      { status: 500 }
    );
  }
}
