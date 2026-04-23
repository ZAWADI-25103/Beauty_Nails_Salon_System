import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PaymentStatus } from 'prisma/generated/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const status = searchParams.get('status');

    const where: any = {};

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    if (status) {
      where.status = status as PaymentStatus;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        sale: {
          include: {
            client: {
              include: {
                user: {
                  select: {
                    name: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(payments);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to fetch transactions' } },
      { status: 500 }
    );
  }
}
