import { errorResponse, handleApiError, requireRole, successResponse } from "@/lib/api/helpers";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {

  try {
    requireRole(['admin', 'client', 'worker'])

    const payments = await prisma.paymentIntent.findMany({
      orderBy:{
        createdAt : "asc"
      },
      cacheStrategy:{
        ttl: 60
      }
    })
    
    if (!payments ) return errorResponse("no payments intents")

    return successResponse(payments)

  } catch (error) {
    return handleApiError(error)
  }
  
}