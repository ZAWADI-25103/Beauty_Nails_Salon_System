import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, successResponse, handleApiError, errorResponse } from '@/lib/api/helpers';

// GET: Fetch usage records for an inventory item
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'worker']);
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const appointmentId = searchParams.get('appointmentId');
    
    const where: any = {};
    if (itemId) where.itemId = itemId;
    if (appointmentId) where.usedFor = appointmentId;
    
    const usages = await prisma.inventoryUsage.findMany({
      where,
      include: {
        item: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return successResponse(usages);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST: Record inventory usage for an appointment
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['worker', 'admin']);
    const body = await request.json();
    
    const {
      appointmentId,
      items, // Array of { itemId, quantity, notes? }
      workerId
    } = body;
    
    if (!appointmentId || !items || items.length === 0) {
      return errorResponse('Données manquantes', 400);
    }
    
    // Verify appointment exists and is in_progress
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { service: true }
    });
    
    if (!appointment) {
      return errorResponse('Rendez-vous non trouvé', 404);
    }
    
    if (appointment.status !== 'in_progress') {
      return errorResponse('Le rendez-vous doit être en cours pour enregistrer l\'utilisation', 400);
    }
    
    // Process each inventory item usage
    const results = [];
    
    for (const usage of items) {
      const item = await prisma.inventoryItem.findUnique({
        where: { id: usage.itemId }
      });
      
      if (!item) {
        return errorResponse(`Article ${usage.itemId} non trouvé`, 404);
      }
      
      // Calculate actual deduction based on unit and shared resource logic
      let deduction = usage.quantity;
      
      // Shared resource logic: if unit is "pièce" and item is marked as shared, only deduct once per appointment
      const isSharedResource = item.unit === 'pièce' && item.name.toLowerCase().includes('flacon');
      if (isSharedResource) {
        // Check if this item was already used for this appointment
        const existingUsage = await prisma.inventoryUsage.findFirst({
          where: {
            itemId: usage.itemId,
            usedFor: appointmentId
          }
        });
        
        if (existingUsage) {
          // Already recorded, skip deduction
          continue;
        }
        // First time use: deduct 1 regardless of quantity requested
        deduction = 1;
      }
      
      // For liquid units (ml), calculate proportional deduction
      if (item.unit === 'ml' && usage.quantity) {
        // e.g., if bottle has 100ml and worker uses 5ml, deduct 5
        deduction = usage.quantity;
      }
      
      // Create usage record
      const usageRecord = await prisma.inventoryUsage.create({
         data: {
          itemId: usage.itemId,
          quantity: deduction,
          usedBy: workerId || user.workerProfile?.id,
          usedFor: appointmentId,
          notes: usage.notes
        }
      });
      
      // Update inventory stock
      const updatedItem = await prisma.inventoryItem.update({
        where: { id: usage.itemId },
        data: {
          currentStock: { decrement: deduction },
          // Update status based on new stock level
          status: {
            set: await calculateStockStatus(item.currentStock - deduction, item.minStock, item?.maxStock!)
          }
        }
      });
      
      // Create transaction record for audit
      await prisma.inventoryTransaction.create({
         data: {
          itemId: usage.itemId,
          quantity: -deduction, // Negative for usage
          type: 'usage',
          notes: `Utilisé pour RDV #${appointmentId} - ${usage.notes || ''}`,
          performedBy: workerId || user.id 
        }
      });
      
      results.push({ usage: usageRecord, item: updatedItem });
    }
    
    return successResponse({ 
      results, 
      message: 'Utilisation des articles enregistrée avec succès' 
    });
    
  } catch (error) {
    return handleApiError(error);
  }
}

// Helper function to calculate stock status
async function calculateStockStatus(currentStock: number, minStock: number, maxStock?: number) {
  if (currentStock === 0) return 'out_of_stock';
  if (currentStock <= minStock) return 'critical';
  if (maxStock && currentStock <= minStock * 1.5) return 'low';
  return 'good';
}