import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const discounts = await prisma.discountCode.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(discounts);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to fetch discounts' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      code, 
      type, 
      value, 
      minPurchase, 
      maxUses, 
      startDate, 
      endDate,
      isActive = true
    } = body;

    const discount = await prisma.discountCode.create({
      data: {
        code,
        type,
        value,
        minPurchase,
        maxUses,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
      },
    });

    return NextResponse.json(discount);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to create discount code' } },
      { status: 500 }
    );
  }
}
