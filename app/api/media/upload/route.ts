import { errorResponse, handleApiError, successResponse } from '@/lib/api/helpers';
import { requireRole } from '@/lib/auth/auth';
import prisma from '@/lib/prisma';
import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

// src/app/api/media/upload/route.ts
export async function POST(request: NextRequest) {
  try {
    requireRole(["admin", "client", "worker"]);

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    // 1. Use formData instead of json
    const formData = await request.formData();
    const file = formData.get('file') as File; // This is now a true Blob/File
    
    // 2. Get other metadata from formData
    const workerId = formData.get('workerId') as string;
    const appointmentId = formData.get('appointmentId') as string;
    const clientId = formData.get('clientId') as string;

    if (!file) return errorResponse("un fichier manque");

    // Vercel Blob handles File objects perfectly
    const blobToken = process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN;

    const blob = await put(`Beautynails/medias/${Date.now()}-${filename!}`, file, {
      access: 'public',
      token: blobToken
    });

    // ... rest of your Prisma logic
    const media = await prisma.media.create({
      data: {
        name: filename!,
        appointmentId: appointmentId || '',
        clientId: clientId || '',
        workerId: workerId || '', 
        url: blob.url,
        type: blob.contentType?.startsWith("image") ? "IMAGE" : blob.contentType?.startsWith("video") ? "VIDEO" : "DOCUMENT",
        mimeType: blob.contentType,
      },
    });

    return NextResponse.json(media);
  } catch (error) {
    return handleApiError(error);
  }
}

