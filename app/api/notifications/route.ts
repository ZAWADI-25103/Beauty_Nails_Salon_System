"use server"
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, successResponse, handleApiError } from '@/lib/api/helpers';
import { CreateNotificationData } from '@/lib/api/notifications';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    const { searchParams } = new URL(request.url);
    const unread = searchParams.get('unread');
    const limit = parseInt(searchParams.get('limit') || '50');
    const userId = searchParams.get('userId');

    const where: any = userId ? { userId } : { userId: user.id };
    if (unread === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      cacheStrategy: { 
        ttl: 60,      // Fresh for 60 seconds
        swr: 30,      // For another 30s, serve old data while updating in background
      },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
      cacheStrategy: { 
        ttl: 60,      // Fresh for 60 seconds
        swr: 30,      // For another 30s, serve old data while updating in background
      },
    });

    return successResponse({
      notifications,
      unreadCount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateNotificationData = await request.json();

    // Validate input if necessary
    if (!body.userId || !body.type || !body.title || !body.message) {
      return Response.json({ error: { message: 'Missing required fields' } }, { status: 400 });
    }

    // Call your database function to create a new notification
    const newNotification = await prisma.notification.create({ data: {...body, isRead: false } })
    // Return the created notification
    
    return successResponse({newNotification, message: "notification has been send successfully!"}, 201);
  } catch (error) {
    console.error('Error creating notification:', error);
    return Response.json({ error: { message: 'Failed to create notification' } }, { status: 500 });
  }
}