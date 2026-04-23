"use server"

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError, requireRole } from "@/lib/api/helpers";

export async function POST(request: NextRequest) {
  try {
    await requireRole(["worker", "admin"]);

    const body = await request.json();
    const {
      workerId,
      period,
      totalRevenue,
      appointmentsCount,
      commissionRate,
    } = body;

    const existing = await prisma.commission.findUnique({
      where: {
        workerId_period: {
          workerId,
          period,
        },
      },
    });

    if (existing) {
      throw new Error("Commission déjà générée pour cette période");
    }


    const commissionAmount = totalRevenue * (commissionRate / 100);

    const commission = await prisma.commission.create({
      data: {
        workerId,
        period,
        totalRevenue,
        appointmentsCount,
        commissionRate,
        commissionAmount,
      },
    });

    const admin = await prisma.user.findFirst({
      where: { role: "admin" },
    });
    const adminId = admin?.id;

    const worker = await prisma.workerProfile.findUnique({
      where: { id: workerId },
      include: { user: true },
    });
    const workerName = worker?.user.name || "Employé";

    await prisma.notification.create({
      data: {
        user : {
          connect: { id: adminId! },
        },
        type: "system",
        title: "Demande de paiement",
        message: `Le travailleur ${workerName} demande le paiement pour ${period}`,
        link: `/dashboard/admin?workerId=${workerId}&commissionId=${commission.id}`
      },
    });

    await prisma.notification.create({
      data: {
        user : {
          connect: { id: worker?.userId! },
        },
        type: "system",
        title: "Demande de paiement",
        message: `Votre demande de paiement pour ${period} a été créée. Veuillez attendre la validation par l'administrateur.`,
        link: `/dashboard/worker?workerId=${workerId}&commissionId=${commission.id}`
      },
    });

    return successResponse(commission);
  } catch (error) {
    return handleApiError(error);
  }
}


export async function GET() {
  try {
    await requireRole(["admin", "worker"]);

    const commissions = await prisma.commission.findMany({
      include: {
        worker: {
          include: { user: true },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      cacheStrategy: { 
        ttl: 60,      // Fresh for 60 seconds
        swr: 30,      // For another 30s, serve old data while updating in background
      },
    });

    // console.log(commissions)

    return successResponse(commissions);
  } catch (error) {
    return handleApiError(error);
  }
}