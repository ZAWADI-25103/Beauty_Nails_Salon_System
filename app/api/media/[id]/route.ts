import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse } from '@/lib/api/helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {

  try {
    const id = params.id

    const media = await prisma.media.findUnique({
      where: {
        id
      }
    })

    return successResponse(media)

  } catch (error) {
    
  }
}