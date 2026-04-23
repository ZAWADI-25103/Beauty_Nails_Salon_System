import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, autoRenew, endDate } = body;

    const purchase = await prisma.membershipPurchase.update({
      where: { id: params.id },
      data: {
        status,
        autoRenew,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    });

    return NextResponse.json(purchase);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to update purchase' } },
      { status: 500 }
    );
  }
}
