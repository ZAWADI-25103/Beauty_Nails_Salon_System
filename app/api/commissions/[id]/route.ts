"use server"

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, successResponse, handleApiError, errorResponse } from "@/lib/api/helpers";
import { error } from "node:console";
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; }>; }
){
  try {

  const id = (await context.params).id;
    // Only admin can approve/pay
    const currentUser = await requireRole(["admin"]);

    const body = await request.json();

    const commission = await prisma.commission.findUnique({
      where: { id },
      include: {
        worker: {
          include: { user: true },
        },
      },
    });

    if (!commission) {
      throw new Error("Commission introuvable");
    }

    if (commission.status === 'paid') return errorResponse("Cette commission est deja regler")

    const updated = await prisma.$transaction(async (tx) => {
      // 1️⃣ Update worker commission
      const updatedCommission = await tx.commission.update({
        where: { id },
          data: {
          status: body.status,
          paidAt: body.status === "paid" ? new Date() : undefined,
        },
      });

      // 2️⃣ Calculate employer share
      const employerAmount =
        commission.totalRevenue - commission.commissionAmount;

      // 3️⃣ Notify worker
      await tx.notification.create({
        data: {
          userId: commission.worker.userId,
          type: "payment_received",
          title: "Paiement approuvé",
          message: `Votre commission pour ${commission.period} a été payée (${commission.commissionAmount} CDF).`,
          link: `/dashboard/worker?commissionId=${commission.id}`,
        },
      });

      // 4️⃣ Notify admin (confirmation log)
      await tx.notification.create({
        data: {
          userId: currentUser.id,
          type: "system",
          title: "Commission payée",
          message: `Paiement effectué pour ${commission.worker.user.name}. Revenu admin: ${employerAmount} CDF`,
        },
      });

      return updatedCommission;
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

