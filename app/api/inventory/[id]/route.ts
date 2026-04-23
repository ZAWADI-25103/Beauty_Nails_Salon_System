import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, errorResponse, successResponse, handleApiError } from '@/lib/api/helpers';
import { StockStatus } from '@/prisma/generated/enums';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; }>; }
) {
  try {
    const id = (await context.params).id;
    const user = await requireRole(['admin', 'worker']);
    const body = await request.json();
    const { quantity, operation, notes } = body;

    let newQuantity: number;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!item) {
      return errorResponse('Article non trouvé', 404);
    }

    switch (operation) {
      case 'add':
        newQuantity = item.currentStock + quantity;
        break;
      case 'remove':
        newQuantity = Math.max(0, item.currentStock - quantity);
        break;
      case 'set':
        newQuantity = quantity;
        break;
      default:
        return errorResponse('Opération invalide', 400);
    }

    // Determine status based on stock levels
    let status: StockStatus = StockStatus.good;
    if (newQuantity === 0) {
      status = StockStatus.out_of_stock;
    } else if (newQuantity <= item.minStock) {
      status = StockStatus.critical;
    } else if (newQuantity <= item.minStock * 1.5) {
      status = StockStatus.low;
    }

    // Update inventory and create transaction
    const [updatedItem] = await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { id: id },
        data: {
          currentStock: newQuantity,
          status,
          ...(operation === 'add' && { lastRestocked: new Date() }),
        },
      }),
      prisma.inventoryTransaction.create({
        data: {
          itemId: id,
          quantity: operation === 'remove' ? -quantity : quantity,
          type: operation === 'add' ? 'purchase' : 'usage',
          notes,
          performedBy: user.id,
        },
      }),
    ]);

    return successResponse({
      message: 'Stock mis à jour',
      item: updatedItem,
    });
  } catch (error) {
    return handleApiError(error);
  }
}