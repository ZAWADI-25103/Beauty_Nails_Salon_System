import { successResponse } from "@/lib/api/helpers";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");

  const payment = await prisma.paymentIntent.findFirst({
    where: {
      phoneNumber: phone!,
      status: "success",
      createdAt: {
        gte: new Date(Date.now() - 20 * 60 * 1000),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return successResponse({
    paid: !!payment,
    amount: payment?.amount || 0,
    paymentIntent: payment,
  });
}