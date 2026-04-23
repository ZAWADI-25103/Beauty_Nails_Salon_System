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
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              }
            },
          },
        },
        items: {
          include: {
            service: true,
          },
        },
        payments: true,
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: { message: 'Sale not found' } },
        { status: 404 }
      );
    }

    // Transform data for receipt if needed, or return as is
    const receiptData = {
      receiptNumber: sale.receiptNumber,
      date: sale.createdAt,
      clientName: sale.client.user.name,
      clientPhone: sale.client.user.phone,
      items: sale.items.map(item => ({
        name: item.service.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      })),
      subtotal: sale.subtotal,
      discount: sale.discount,
      tax: sale.tax,
      tip: sale.tip,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      paymentStatus: sale.paymentStatus,
      notes: sale.notes,
    };

    return NextResponse.json(receiptData);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to fetch receipt' } },
      { status: 500 }
    );
  }
}
