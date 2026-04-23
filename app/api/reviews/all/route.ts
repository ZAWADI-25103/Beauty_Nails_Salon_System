import { handleApiError, requireRole, successResponse } from "@/lib/api/helpers";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest){
  try {

    requireRole(["admin"])

    let reviews = await prisma.review.findMany({
      cacheStrategy:{
        ttl: 60
      }
    })

    return successResponse(reviews);

  } catch (error) {
    return handleApiError(error)
  }
}