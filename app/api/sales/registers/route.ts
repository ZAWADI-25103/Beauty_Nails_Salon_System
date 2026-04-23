import { errorResponse, handleApiError, requireRole, successResponse } from "@/lib/api/helpers";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {

  try {
    requireRole(['admin'])

    const registers = await prisma.dailyRegister.findMany({
      orderBy:{
        createdAt : "asc"
      },
      cacheStrategy:{
        ttl: 60
      }
    })
    
    if (!registers ) return errorResponse("no registers")

    return successResponse(registers)

  } catch (error) {
    return handleApiError(error)
  }
  
}