import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    const sale = await prisma.sale.findUnique({
      where: { id: params.id },
      include: { payments: true },
    });

    if (!sale) {
      return NextResponse.json(
        { error: { message: 'Sale not found' } },
        { status: 404 }
      );
    }

    if (sale.paymentStatus === 'refunded') {
      return NextResponse.json(
        { error: { message: 'Sale already refunded' } },
        { status: 400 }
      );
    }

    const updatedSale = await prisma.$transaction(async (tx) => {
      // 1. Update sale status
      const updated = await tx.sale.update({
        where: { id: params.id },
        data: {
          paymentStatus: 'refunded',
          notes: sale.notes 
            ? `${sale.notes}\n[Remboursement] ${reason || 'Aucune raison spécifiée'}` 
            : `[Remboursement] ${reason || 'Aucune raison spécifiée'}`,
        },
      });

      // 2. Update all associated payments status
      await tx.payment.updateMany({
        where: { saleId: params.id },
        data: { status: 'refunded' },
      });

      // 3. Update client total spent
      await tx.clientProfile.update({
        where: { id: sale.clientId },
        data: {
          totalSpent: { decrement: sale.total },
        },
      });

      // 4. Return loyalty points if any were used
      if (sale.loyaltyPointsUsed > 0) {
        await tx.clientProfile.update({
          where: { id: sale.clientId },
          data: {
            // loyaltyPoints: { increment: sale.loyaltyPointsUsed },
          },
        });

        await tx.loyaltyTransaction.create({
          data: {
            clientId: sale.clientId,
            points: sale.loyaltyPointsUsed,
            type: 'adjustment',
            description: `Restitution points suite remboursement vente ${sale.receiptNumber}`,
            relatedId: sale.id,
          },
        });
      }

      return updated;
    });

    return NextResponse.json({
      sale: updatedSale,
      message: 'Vente remboursée avec succès',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Refund failed' } },
      { status: 500 }
    );
  }
}
