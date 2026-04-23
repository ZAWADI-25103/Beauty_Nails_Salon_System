import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { errorResponse, getAuthenticatedUser, successResponse } from "@/lib/api/helpers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await getAuthenticatedUser();
    if (!user) return errorResponse("Unauthorized", 401);
    const clientId = user.clientProfile?.id;
    const {
      phoneNumber,
      amount,
      serviceId,
      workerId,
      serviceName,
      workerName,
      clientName,
      subtotal,
      discount,
      tax,
      tip,
      total,
    } = body;

    if (!phoneNumber || !amount) {
      return errorResponse("Missing required fields: phoneNumber and amount");
    }

    // Optional: avoid duplicates (reuse latest pending)
    const existing = await prisma.paymentIntent.findFirst({
      where: {
        phoneNumber,
        status: "pending",
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      return successResponse({
        success: true,
        paymentIntent: existing,
        reused: true,
      })
    }

    // Create new intent
    const paymentIntent = await prisma.paymentIntent.create({
      data: {
        phoneNumber,
        amount,
        serviceId,
        workerId,
        status: "pending",
        serviceName,
        workerName,
        clientName,
        subtotal,
        discount,
        tax,
        tip,
        total,
      },
    });

    await prisma.clientProfile.update({
      where: { id: clientId },
      data: {
        prepaymentBalance:{
          increment: total
        }
      },
    });

    return Response.json({
      success: true,
      paymentIntent,
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}