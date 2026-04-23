import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const discount = await prisma.discountCode.findUnique({
      where: { id: params.id },
    });

    if (!discount) {
      return NextResponse.json(
        { error: { message: 'Discount not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(discount);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to fetch discount' } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { code, type, value, minPurchase, maxUses, startDate, endDate, isActive } = body;

    const discount = await prisma.discountCode.update({
      where: { id: params.id },
      data: {
        code,
        type,
        value,
        minPurchase,
        maxUses,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isActive,
      },
    });

    return NextResponse.json(discount);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to update discount' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.discountCode.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Discount deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to delete discount' } },
      { status: 500 }
    );
  }
}
