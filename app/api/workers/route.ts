import { errorResponse, handleApiError, requireRole, successResponse } from "@/lib/api/helpers";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {

  try {
    requireRole(['admin'])

    const workers = await prisma.workerProfile.findMany({
      select:{
        id: true,
        user:{
          select: {
            name: true
          }
        }
      },
      orderBy:{
        createdAt : "asc"
      },
      cacheStrategy:{
        ttl: 60
      }
    })
    
    if (!workers ) return errorResponse("no workers")

    return successResponse(workers)

  } catch (error) {
    return handleApiError(error)
  }
  
}