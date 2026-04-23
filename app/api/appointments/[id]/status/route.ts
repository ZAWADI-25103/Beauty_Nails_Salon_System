"use server"
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, successResponse, handleApiError } from '@/lib/api/helpers';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await context.params).id;
    await requireRole(['admin', 'worker']);

    const body = await request.json();
    const { status } = body;

    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Get appointment first
      const appointment = await tx.appointment.findUnique({
        where: { id },
      });

      if (!appointment) {
        throw new Error("Rendez-vous introuvable");
      }

      // 🚫 BLOCK if trying to start a new session
      if (status === "in_progress") {

        // Check worker
        const workerBusy = await tx.appointment.findFirst({
          where: {
            workerId: appointment.workerId,
            status: "in_progress",
            NOT: { id },
          },
        });

        if (workerBusy) {
          throw new Error("Impossible de démarrer : vous avez déjà une prestation en cours. Terminez-la d'abord.");
        }

        // Check client
        const clientBusy = await tx.appointment.findFirst({
          where: {
            clientId: appointment.clientId,
            status: "in_progress",
            NOT: { id },
          },
        });

        if (clientBusy) {
          throw new Error("Ce client est déjà en cours de prestation avec un autre rendez-vous.");
        }
      }

      // 2️⃣ Update appointment AFTER validation
      const updatedAppointment = await tx.appointment.update({
        where: { id },
        data: { status },
        include: {
          client: { include: { user: true } },
          worker: true,
          service: true,
        },
      });

      // 3️⃣ Handle completion logic
      if (status === 'completed') {
        await tx.clientProfile.update({
          where: { id: updatedAppointment.clientId },
          data: {
            totalAppointments: { increment: 1 },
            totalSpent: { increment: updatedAppointment.price },
          },
        });

        await tx.loyaltyTransaction.create({
          data: {
            clientId: updatedAppointment.clientId,
            points: 5,
            type: 'earned_appointment',
            description: `Points gagnés pour avoir terminer le service ${updatedAppointment.service.name}`,
            relatedId: updatedAppointment.id,
          },
        });

        await tx.notification.create({
          data: {
            userId: updatedAppointment.client.userId,
            type: 'loyalty_reward',
            title: 'Points de fidélité',
            message: 'Vous avez gagné 5 points de fidélité !',
          },
        });

        await tx.commission.create({
          data: {
            worker: { connect: { id: updatedAppointment.workerId } },
            appointmentsCount: 1,
            commissionAmount:
              updatedAppointment.price *
              updatedAppointment.service.workerCommission / 100,
            commissionRate: updatedAppointment.service?.workerCommission ?? 0,
            status: 'pending',
            totalRevenue: updatedAppointment.price,
            period: `${format(
              new Date(updatedAppointment.date),
              "EEEE d MMMM 'à' HH'h'mm",
              { locale: fr }
            )}`,
            businessEarnings:
              updatedAppointment.price -
              (updatedAppointment.price *
                updatedAppointment.service.workerCommission / 100),
            materialsCost:
              (updatedAppointment.price -
                (updatedAppointment.price *
                  updatedAppointment.service.workerCommission / 100)) * 0.05,
            operationalCost:
              (updatedAppointment.price -
                (updatedAppointment.price *
                  updatedAppointment.service.workerCommission / 100)) * 0.05,
          },
        });
      }

      return updatedAppointment;
    });

    return successResponse({
      message: 'Statut mis à jour',
      appointment: result,
    });

  } catch (error: any) {
    return handleApiError(error);
  }
}