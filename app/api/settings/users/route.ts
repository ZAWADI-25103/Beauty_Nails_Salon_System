import { handleApiError, requireRole, successResponse } from "@/lib/api/helpers";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest){
  try {

    requireRole(["admin"])

    const users = await prisma.user.findMany({
      cacheStrategy:{
        ttl: 60
      }
    })

    return successResponse(users);

  } catch (error) {
    return handleApiError(error)
  }
}
