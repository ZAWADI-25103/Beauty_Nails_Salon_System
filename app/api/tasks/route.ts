"use server"
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, successResponse, handleApiError } from '@/lib/api/helpers';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'worker']);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const assignedTo = searchParams.get('assignedTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (type) where.type = type;
    if (assignedTo) where.assignedToWorkerId = assignedTo;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignedTo: {
            select: { id: true, user: { select: { id: true, name: true, email: true } } },
          },
          client: {
            select: { id: true, user: { select: { id: true, name: true, email: true } } },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return successResponse({ tasks, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'worker']);
    const body = await request.json();

    const {
      title,
      description,
      type,
      priority,
      clientId,
      assignedToWorkerId,
      dueAt,
      scheduledAt,
      isPrivate,
    } = body;

    if (!title) {
      throw new Error('Title is required');
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        type,
        priority,
        clientId,
        assignedToWorkerId,
        dueAt: dueAt ? new Date(dueAt) : undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        isPrivate: !!isPrivate,
        createdById: user.id,
      },
      include: {
        assignedTo: { include: { user: true } },
        client: { include: { user: true } },
        createdBy: true,
      },
    });

    return successResponse({ message: 'Task created', task }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
