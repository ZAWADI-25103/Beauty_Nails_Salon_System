import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, successResponse, handleApiError, errorResponse } from '@/lib/api/helpers';

// GET: Fetch pending transfer requests for the current worker
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(['worker']);
    
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: user.id }
    });
    
    if (!workerProfile) {
      return errorResponse('Profil employé non trouvé', 404);
    }
    
    // Fetch pending transfers where this worker is the recipient
    const pendingTransfers = await prisma.appointmentTransfer.findMany({
      where: {
        newWorkerId: workerProfile.id,
        status: 'pending'
      },
      include: {
        appointment: {
          include: {
            client: { include: { user: true } },
            service: true,
            transfer: {
                include: {
                    originalWorker: { include: { user: true } }
                }
            }
          }
        },
        originalWorker: { include: { user: true } }
      },
      orderBy: { requestedAt: 'desc' }
    });
    
    return successResponse(pendingTransfers);
  } catch (error) {
    return handleApiError(error);
  }
}