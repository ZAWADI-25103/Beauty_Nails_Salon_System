import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: params.id },
      include: {
        client: {
          include: {
            user: true,
          },
        },
        items: {
          include: {
            service: true,
          },
        },
        payments: true,
        appointment: true,
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: { message: 'Sale not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(sale);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to fetch sale' } },
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
    
    // We only allow updating certain fields for now
    const { notes, paymentStatus } = body;

    const updatedSale = await prisma.sale.update({
      where: { id: params.id },
      data: {
        notes,
        paymentStatus,
      },
      include: {
        items: true,
        payments: true,
      },
    });

    return NextResponse.json(updatedSale);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to update sale' } },
      { status: 500 }
    );
  }
}
