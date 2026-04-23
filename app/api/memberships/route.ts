import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const memberships = await prisma.membership.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
    return NextResponse.json(memberships);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to fetch memberships' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, duration, price, discount, benefits, isActive, displayOrder } = body;

    const membership = await prisma.membership.create({
      data: {
        name,
        duration,
        price,
        discount,
        benefits: benefits || {},
        isActive: isActive ?? true,
        displayOrder: displayOrder ?? 0,
      },
    });

    return NextResponse.json(membership);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to create membership' } },
      { status: 500 }
    );
  }
}
