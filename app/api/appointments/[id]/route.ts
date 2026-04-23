"use server"
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, errorResponse, successResponse, handleApiError } from '@/lib/api/helpers';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; }>; }
) {
  try {
    // context: { params: Promise<{ id: string; }>; }
    const id = (await context.params).id;
    const user = await getAuthenticatedUser();
    const body = await request.json();
    const { reason } = body;

    const appointment = await prisma.appointment.findUnique({
      where: { id, status: { not: 'cancelled' } },
    });

    if (!appointment) {
      return errorResponse('Rendez-vous non trouvé', 404);
    }

    // Clients can only cancel their own appointments
    if (user.role === 'client' && appointment.clientId !== user.clientProfile?.id) {
      return errorResponse('Accès interdit', 403);
    }

    const updated = await prisma.appointment.update({
      where: { id},
      data: {
        status: 'cancelled',
        cancelReason: reason,
      },
      include:{
        service:{
          select:{
            price:true,
            name:true,
          }
        },
      }
    });

    const userWorker = await prisma.workerProfile.findUnique({
      where: { id: appointment.workerId },
      include: { user: true },
    });
    const userClient = await prisma.clientProfile.update({
      where: { id: appointment.clientId },
      data:{
        // loyaltyPoints:{
        //   decrement: updated.service.price / 1000
        // },
        prepaymentBalance:{
          increment : appointment.price
        },
        loyaltyTransactions:{
          create:{
            type:"earned_appointment",
            points:-updated.service.price / 1000,
            description:'loyalty points for canceled appointment'
          }}
      },
      include: { user: true },
    });

    if (!userWorker || !userClient) {
      return errorResponse('Employé non trouvé pour la notification', 404);
    }

    // Send notification to worker
    await prisma.notification.create({
      data: {
        userId: userWorker?.user.id,
        type: 'appointment_cancelled',
        title: 'Rendez-vous annulé',
        message: `Un rendez-vous a été annulé. Raison: ${reason}`,
        link: `/dashboard/worker?canceledAppointment=${updated.id}`,
      },
    });

    // Send notification to worker
    await prisma.notification.create({
      data: {
        userId: userClient?.user.id,
        type: 'appointment_cancelled',
        title: 'Rendez-vous annulé',
        message: `Vous avez annulé un rendez-vous. Raison: ${reason}, Si vous avez initie un payement veillez contacter le service client pour obtenir votre remboursement`,
        link: `/dashboard/client?canceledAppointment=${updated.id}`,
      },
    });

    return successResponse({
      message: 'Rendez-vous annulé',
      appointment: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}