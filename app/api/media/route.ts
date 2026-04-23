import { handleApiError, successResponse } from '@/lib/api/helpers';
import { requireRole } from '@/lib/auth/auth';
import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';


export async function GET(req: NextRequest){
  
  try {
    requireRole(["admin","client", "worker"])

    const medias = await prisma.media.findMany()

    return successResponse(medias)
  } catch (error) {
    return handleApiError(error)
  }
}